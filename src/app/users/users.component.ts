import { Component, ViewEncapsulation, ViewChild, OnInit } from '@angular/core';
import { createElement, Internationalization, isNullOrUndefined } from '@syncfusion/ej2-base';
import { DataManager, Query, ReturnOption } from '@syncfusion/ej2-data';
import { Dialog, DialogComponent } from '@syncfusion/ej2-angular-popups';
import { Button } from '@syncfusion/ej2-angular-buttons';
import { EditService, PageService, EditSettingsModel, GridComponent, DialogEditEventArgs } from '@syncfusion/ej2-angular-grids';
import { AddEditUserComponent } from '../add-edit-user/add-edit-user.component';
import { DataService } from '../data.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  providers: [EditService, PageService],
  encapsulation: ViewEncapsulation.None
})
export class UsersComponent implements OnInit {
  @ViewChild('gridObj') gridObj: GridComponent;
  @ViewChild('addEdituserObj') addEdituserObj: AddEditUserComponent;
  @ViewChild('deleteConfirmationDialogObj')
  public deleteConfirmationDialogObj: DialogComponent;
  public usersData: Record<string, any>[];
  public filteredusers: Record<string, any>[];
  public activeuserData: Record<string, any>;
  public hospitalData: Record<string, any>[];
  public agencysData: Record<string, any>[];
  public intl: Internationalization = new Internationalization();
  public editSettings: EditSettingsModel;
  public gridDialog: Dialog;
  public animationSettings: Record<string, any> = { effect: 'None' };

  constructor(public dataService: DataService) {
    this.usersData = this.filteredusers = this.dataService.getusersData();
    this.hospitalData = this.dataService.getHospitalData();
    this.agencysData = this.dataService.getagencysData();
    this.activeuserData = this.filteredusers[0];
    this.editSettings = {
      allowEditing: true,
      allowAdding: true,
      allowDeleting: true,
      mode: 'Dialog'
    };
  }

  public ngOnInit(): void {
    this.dataService.updateActiveItem('users');
  }

  public onuserClick(args: MouseEvent): void {
    const rowIndex: string = (args.currentTarget as HTMLElement).parentElement.getAttribute('index');
    setTimeout(() => {
      this.gridObj.selectRow(parseInt(rowIndex, 10));
      this.gridObj.startEdit();
    });
  }

  public onDataEdit(args: DialogEditEventArgs): void {
    if (args.requestType === 'beginEdit') {
      this.activeuserData = args.rowData as Record<string, any>;
      this.dataService.setActiveuserData(this.activeuserData);
      this.gridDialog = args.dialog as Dialog;
      this.gridDialog.header = 'user Details';
      const fields: Array<string> = ['Id', 'Name', 'Gender', 'DOB', 'BloodGroup', 'Mobile', 'Email', 'city'];
      fields.forEach(field => {
        let value: string;
        if (field === 'DOB' && !isNullOrUndefined(this.activeuserData[field])) {
          value = this.intl.formatDate(this.activeuserData[field] as Date, { skeleton: 'yMd' }).toString();
        } else {
          value = isNullOrUndefined(this.activeuserData[field]) ? '' : this.activeuserData[field].toString();
        }
        (args.dialog as Dialog).element.querySelector('#' + field).innerHTML = value;
      });
      this.gridDialog.element.querySelector('.history-row').appendChild(this.getHistoryDetails());
      const editButtonElement: HTMLElement = createElement('button', {
        className: 'edit-user',
        id: 'edit',
        innerHTML: 'Edit',
        attrs: { type: 'button', title: 'Edit' }
      });
      editButtonElement.onclick = this.onEdituser.bind(this);
      const deleteButtonElement: HTMLElement = createElement('button', {
        className: 'delete-user',
        id: 'delete',
        innerHTML: 'Delete',
        attrs: { type: 'button', title: 'Delete', content: 'DELETE' }
      });
      deleteButtonElement.onclick = this.onDeleteuser.bind(this);
      this.gridDialog.element.querySelector('.e-footer-content').appendChild(deleteButtonElement);
      this.gridDialog.element.querySelector('.e-footer-content').appendChild(editButtonElement);
      const editButton: Button = new Button({ isPrimary: true });
      editButton.appendTo('#edit');
      const deleteButton: Button = new Button();
      deleteButton.appendTo('#delete');
    }
  }

  public onDeleteuser(): void {
    this.deleteConfirmationDialogObj.show();
  }

  public onDeleteClick(): void {
    this.usersData = this.usersData.filter((item: Record<string, any>) => item.Id !== this.activeuserData.Id);
    this.filteredusers = this.usersData;
    this.dataService.setusersData(this.usersData);
    this.gridObj.closeEdit();
    this.deleteConfirmationDialogObj.hide();
  }

  public onDeleteCancelClick(): void {
    this.deleteConfirmationDialogObj.hide();
  }

  public onAdduser(): void {
    this.addEdituserObj.onAdduser();
  }

  public onEdituser(): void {
    this.gridObj.closeEdit();
    this.addEdituserObj.showDetails();
  }

  public getHistoryDetails(): HTMLElement {
    const filteredData: Record<string, any>[] = this.hospitalData.filter((item: Record<string, any>) =>
      item.userId === this.activeuserData.Id);
    const historyElement: HTMLElement = createElement('div', { id: 'history-wrapper' });
    if (filteredData.length > 0) {
      filteredData.map((item: Record<string, any>) => {
        const element: Element = createElement('div', { className: 'history-content' });
        // eslint-disable-next-line max-len
        element.textContent = `${this.intl.formatDate(item.StartTime, { skeleton: 'MMMd' })} - ${this.intl.formatDate(item.StartTime, { skeleton: 'hm' })} - ${this.intl.formatDate(item.EndTime, { skeleton: 'hm' })} Appointment with ${this.getagencyName(item.agencyId)}`;
        historyElement.appendChild(element);
      });
    } else {
      const element: Element = createElement('div', { className: 'empty-container' });
      element.textContent = 'No Events!';
      historyElement.appendChild(element);
    }
    return historyElement;
  }

  public getagencyName(id: number): string {
    const activeagency: Record<string, any>[] = this.agencysData.filter((item: Record<string, any>) => item.Id === id);
    return activeagency[0].Name;
  }

  public userSearch(args: KeyboardEvent): void {
    const searchString: string = (args.target as HTMLInputElement).value;
    if (searchString !== '') {
      new DataManager(this.usersData).executeQuery(new Query().
        search(searchString, ['Id', 'Name', 'Gender', 'BloodGroup', 'Mobile'], null, true, true)).then((e: ReturnOption) => {
          if ((e.result as any).length > 0) {
            this.filteredusers = e.result as Record<string, any>[];
          } else {
            this.filteredusers = [];
          }
        });
    } else {
      this.userSearchCleared(args as any);
    }
  }

  public userSearchCleared(args: MouseEvent): void {
    this.filteredusers = this.usersData;
    if ((args.target as HTMLElement).previousElementSibling) {
      ((args.target as HTMLElement).previousElementSibling as HTMLInputElement).value = '';
    }
  }

  public gridRefresh(): void {
    this.usersData = this.dataService.getusersData();
    this.filteredusers = this.usersData;
    this.gridObj.refresh();
  }
}
