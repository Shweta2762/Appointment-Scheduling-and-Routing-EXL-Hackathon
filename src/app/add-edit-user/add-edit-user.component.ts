/* eslint-disable @typescript-eslint/naming-convention */
import { Component, ViewChild, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { isNullOrUndefined } from '@syncfusion/ej2-base';
import { DialogComponent, BeforeOpenEventArgs } from '@syncfusion/ej2-angular-popups';
import { DropDownList } from '@syncfusion/ej2-angular-dropdowns';
import { EJ2Instance } from '@syncfusion/ej2-angular-schedule';
import { DatePicker } from '@syncfusion/ej2-angular-calendars';
import { FormValidator, MaskedTextBoxComponent, MaskedTextBox } from '@syncfusion/ej2-angular-inputs';
import { DataService } from '../data.service';
import { CalendarComponent } from '../calendar/calendar.component';

@Component({
  selector: 'app-add-edit-user',
  templateUrl: './add-edit-user.component.html',
  styleUrls: ['./add-edit-user.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AddEditUserComponent {
  @Output() refreshEvent = new EventEmitter<string>();
  @ViewChild('newuserObj')
  public newuserObj: DialogComponent;
  public animationSettings: Record<string, any> = { effect: 'None' };
  public title = 'New User';
  public selectedGender = 'Male';
  public dobValue: Date = new Date(1996, 0, 31);
  public dialogState: string;
  public fields: Record<string, any> = { text: 'Text', value: 'Value' };
  public usersData: Record<string, any>[];
  public activeuserData: Record<string, any>;
  public hospitalData: Record<string, any>[];
  public agencysData: Record<string, any>[];

  constructor(private dataService: DataService, private calendarComponent: CalendarComponent) {
    this.usersData = this.dataService.getusersData();
    this.hospitalData = this.dataService.getHospitalData();
    this.agencysData = this.dataService.getagencysData();
    this.activeuserData = this.dataService.getActiveuserData();
  }

  public onAdduser(): void {
    this.dialogState = 'new';
    this.title = 'New user';
    this.newuserObj.show();
  }

  public onCancelClick(): void {
    this.resetFormFields();
    this.newuserObj.hide();
  }

  public onSaveClick(): void {
    const formElementContainer: HTMLElement = document.querySelector('.new-user-dialog #new-user-form');
    if (formElementContainer && formElementContainer.classList.contains('e-formvalidator') &&
      !((formElementContainer as EJ2Instance).ej2_instances[0] as FormValidator).validate()) {
      return;
    }
    const obj: Record<string, any> = this.dialogState === 'new' ? {} : this.activeuserData;
    const formElement: HTMLInputElement[] = [].slice.call(document.querySelectorAll('.new-user-dialog .e-field'));
    for (const curElement of formElement) {
      let columnName: string = curElement.querySelector('input').name;
      const isDropElement: boolean = curElement.classList.contains('e-ddl');
      const isDatePickElement: boolean = curElement.classList.contains('e-date-wrapper');
      if (!isNullOrUndefined(columnName) || isDropElement || isDatePickElement) {
        if (columnName === '' && isDropElement) {
          columnName = curElement.querySelector('select').name;
          const instance: DropDownList = (curElement.parentElement as EJ2Instance).ej2_instances[0] as DropDownList;
          obj[columnName] = instance.value;
        } else if (columnName === 'DOB' && isDatePickElement) {
          const instance: DatePicker = (curElement.parentElement as EJ2Instance).ej2_instances[0] as DatePicker;
          obj[columnName] = instance.value;
        } else if (columnName === 'Gender') {
          obj[columnName] = curElement.querySelector('input').checked ? 'Male' : 'Female';
        } else {
          obj[columnName] = curElement.querySelector('input').value;
        }
      }
    }
    this.usersData = this.dataService.getusersData();
    if (this.dialogState === 'new') {
      obj.Id = Math.max.apply(Math, this.usersData.map((data: Record<string, any>) => data.Id)) + 1;
      obj.NewuserClass = 'new-user';
      this.usersData.push(obj);
    } else {
      this.activeuserData = obj;
      this.usersData.forEach((userData: Record<string, any>) => {
        if (userData.Id === obj.Id) {
          Object.assign(userData, obj);
        }
      });
      this.dataService.setActiveuserData(this.activeuserData);
    }
    const activityObj: Record<string, any> = {
      Name: this.dialogState === 'new' ? 'Added New user' : 'Updated user',
      Message: `${obj.Name} for ${obj.city}`,
      Time: '10 mins ago',
      Type: 'user',
      ActivityTime: new Date()
    };
    this.dataService.addActivityData(activityObj);
    this.dataService.setusersData(this.usersData);
    this.refreshEvent.emit();
    if(!isNullOrUndefined(this.calendarComponent) && !isNullOrUndefined(this.calendarComponent.comboBox)) {
      this.calendarComponent.comboBox.dataSource = [];
      this.calendarComponent.comboBox.dataSource = this.usersData;
    }
    this.resetFormFields();
    this.newuserObj.hide();
  }

  public resetFormFields(): void {
    const formElement: HTMLInputElement[] = [].slice.call(document.querySelectorAll('.new-user-dialog .e-field'));
    this.dataService.destroyErrorElement(document.querySelector('#new-user-form'), formElement);
    for (const curElement of formElement) {
      let columnName: string = curElement.querySelector('input').name;
      const isDropElement: boolean = curElement.classList.contains('e-ddl');
      const isDatePickElement: boolean = curElement.classList.contains('e-date-wrapper');
      if (!isNullOrUndefined(columnName) || isDropElement || isDatePickElement) {
        if (columnName === '' && isDropElement) {
          columnName = curElement.querySelector('select').name;
          const instance: DropDownList = (curElement.parentElement as EJ2Instance).ej2_instances[0] as DropDownList;
          instance.value = (instance as any).dataSource[0];
        } else if (columnName === 'DOB' && isDatePickElement) {
          const instance: DatePicker = (curElement.parentElement as EJ2Instance).ej2_instances[0] as DatePicker;
          instance.value = new Date();
        } else if (columnName === 'Gender') {
          curElement.querySelectorAll('input')[0].checked = true;
        } else if(columnName === 'Mobile') {
          ((curElement.parentElement as EJ2Instance).ej2_instances[0] as MaskedTextBox).value = '';
        } else {
          curElement.querySelector('input').value = '';
        }
      }
    }
  }

  public onGenderChange(args: Record<string, any>): void {
    this.selectedGender = args.target.value;
  }

  public showDetails(): void {
    this.dialogState = 'edit';
    this.title = 'Edit user';
    this.newuserObj.show();
    this.activeuserData = this.dataService.getActiveuserData();
    const obj: Record<string, any> = this.activeuserData;
    const formElement: HTMLInputElement[] = [].slice.call(document.querySelectorAll('.new-user-dialog .e-field'));
    for (const curElement of formElement) {
      let columnName: string = curElement.querySelector('input').name;
      const isCustomElement: boolean = curElement.classList.contains('e-ddl');
      const isDatePickElement: boolean = curElement.classList.contains('e-date-wrapper');
      if (!isNullOrUndefined(columnName) || isCustomElement || isDatePickElement) {
        if (columnName === '' && isCustomElement) {
          columnName = curElement.querySelector('select').name;
          const instance: DropDownList = (curElement.parentElement as EJ2Instance).ej2_instances[0] as DropDownList;
          instance.value = obj[columnName] as string;
          instance.dataBind();
        } else if (columnName === 'DOB' && isDatePickElement) {
          const instance: DatePicker = (curElement.parentElement as EJ2Instance).ej2_instances[0] as DatePicker;
          instance.value = obj[columnName] as Date || null;
        } else if (columnName === 'Gender') {
          if (obj[columnName] === 'Male') {
            curElement.querySelectorAll('input')[0].checked = true;
          } else {
            curElement.querySelectorAll('input')[1].checked = true;
          }
        } else if (columnName === 'Mobile') {
          ((curElement.parentElement as EJ2Instance).ej2_instances[0] as MaskedTextBox).value =
            obj[columnName].replace(/[ -.*+?^${}()|[\]\\]/g, '');
        } else {
          curElement.querySelector('input').value = obj[columnName] as string;
        }
      }
    }
  }

  public onBeforeOpen(args: BeforeOpenEventArgs): void {
    const formElement: HTMLFormElement = args.element.querySelector('#new-user-form');
    if (formElement && formElement.ej2_instances) {
      return;
    }
    const customFn: (args: { [key: string]: HTMLElement }) => boolean = (e: { [key: string]: HTMLElement }) => {
      const argsLength = ((e.element as EJ2Instance).ej2_instances[0] as MaskedTextBoxComponent).value.length;
      return (argsLength !== 0) ? argsLength >= 10 : false;
    };
    const rules: Record<string, any> = {};
    rules.Name = { required: [true, 'Enter valid name'] };
    rules.DOB = { required: true, date: [true, 'Select valid DOB'] };
    rules.Mobile = { required: [customFn, 'Enter valid mobile number'] };
    rules.Email = { required: [true, 'Enter valid email'], email: [true, 'Email address is invalid'] };
    this.dataService.renderFormValidator(formElement, rules, this.newuserObj.element);
  }
}
