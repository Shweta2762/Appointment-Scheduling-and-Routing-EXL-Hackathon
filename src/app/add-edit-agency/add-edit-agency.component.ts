/* eslint-disable @typescript-eslint/naming-convention */
import { Component, ViewChild, ViewEncapsulation, Output, EventEmitter } from '@angular/core';
import { isNullOrUndefined } from '@syncfusion/ej2-base';
import { FormValidator, MaskedTextBoxComponent, MaskedTextBox } from '@syncfusion/ej2-angular-inputs';
import { EJ2Instance } from '@syncfusion/ej2-angular-schedule';
import { DialogComponent, BeforeOpenEventArgs } from '@syncfusion/ej2-angular-popups';
import { DropDownList, DropDownListComponent } from '@syncfusion/ej2-angular-dropdowns';
import { specializationData, experienceData, dutyTimingsData } from '../datasource';
import { DataService } from '../data.service';
import { CalendarComponent } from '../calendar/calendar.component';

@Component({
  selector: 'app-add-edit-agency',
  templateUrl: './add-edit-agency.component.html',
  styleUrls: ['./add-edit-agency.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AddEditagencyComponent {
  @Output() refreshagencys = new EventEmitter<string>();
  @ViewChild('newagencyObj') newagencyObj: DialogComponent;
  @ViewChild('specializationObj') specializationObj: DropDownListComponent;

  public agencysData: Record<string, any>[];
  public activeagencyData: Record<string, any>;
  public dialogState: string;
  public animationSettings: Record<string, any> = { effect: 'None' };
  public title = 'New Agency';
  public specializationData: Record<string, any>[] = specializationData;
  public fields: Record<string, any> = { text: 'Text', value: 'Id' };
  public experienceData: Record<string, any>[] = experienceData;
  public dutyTimingsData: Record<string, any>[] = dutyTimingsData;

  constructor(private dataService: DataService, private calendarComponent: CalendarComponent) {
    this.agencysData = this.dataService.getagencysData();
    this.activeagencyData = this.dataService.getActiveagencyData();
  }

  public onAddagency(): void {
    this.dialogState = 'new';
    this.title = 'New Agency';
    this.newagencyObj.show();
  }

  public onCancelClick(): void {
    this.resetFormFields();
    this.newagencyObj.hide();
  }

  public onSaveClick(): void {
    const formElementContainer: HTMLElement = document.querySelector('.new-agency-dialog #new-agency-form');
    if (formElementContainer && formElementContainer.classList.contains('e-formvalidator') &&
      !((formElementContainer as EJ2Instance).ej2_instances[0] as FormValidator).validate()) {
      return;
    }
    let obj: Record<string, any> = this.dialogState === 'new' ? {} : this.activeagencyData;
    const formElement: HTMLInputElement[] = [].slice.call(document.querySelectorAll('.new-agency-dialog .e-field'));
    for (const curElement of formElement) {
      let columnName: string = curElement.querySelector('input').name;
      const isCustomElement: boolean = curElement.classList.contains('e-ddl');
      if (!isNullOrUndefined(columnName) || isCustomElement) {
        if (columnName === '' && isCustomElement) {
          columnName = curElement.querySelector('select').name;
          const instance: DropDownList = (curElement.parentElement as EJ2Instance).ej2_instances[0] as DropDownList;
          obj[columnName] = instance.value;
          if (columnName === 'Specialization') {
            obj.DepartmentId = (instance.getDataByValue(instance.value) as Record<string, any>).DepartmentId;
          }
        }
         else {
          obj[columnName] = curElement.querySelector('input').value;
        }
      }
    }
    if (this.dialogState === 'new') {
      obj.Id = Math.max.apply(Math, this.agencysData.map((data: Record<string, any>) => data.Id)) + 1;
      obj.Text = 'default';
      obj.Availability = 'available';
      obj.NewagencyClass = 'new-agency';
      obj.Color = '#7575ff';
      const initialData: Record<string, any> = JSON.parse(JSON.stringify(this.agencysData[0]));
      obj.AvailableDays = initialData.AvailableDays;
      obj.WorkDays = initialData.WorkDays;
      obj = this.updateWorkHours(obj);
      this.agencysData.push(obj);
      this.dataService.setagencysData(this.agencysData);
    } else {
      this.activeagencyData = this.updateWorkHours(obj);
      this.dataService.setActiveagencyData(this.activeagencyData);
    }
    const activityObj: Record<string, any> = {
      Name: this.dialogState === 'new' ? 'Added New Agency' : 'Updated Agency',
      Message: `${obj.Name}, ${obj.Specialization.charAt(0).toUpperCase() + obj.Specialization.slice(1)}`,
      Time: '10 mins ago',
      Type: 'agency',
      ActivityTime: new Date()
    };
    this.dataService.addActivityData(activityObj);
    this.refreshagencys.emit();
    if(!isNullOrUndefined(this.calendarComponent) && !isNullOrUndefined(this.calendarComponent.dropdownObj)) {
      this.calendarComponent.dropdownObj.dataSource = [];
      this.calendarComponent.dropdownObj.dataSource = this.agencysData;
    }
    this.resetFormFields();
    this.newagencyObj.hide();
  }

  public updateWorkHours(data: Record<string, any>): Record<string, any> {
    const dutyString: string = this.dutyTimingsData.filter((item: Record<string, any>) => item.Id === data.DutyTiming)[0].Text;
    let startHour: string;
    let endHour: string;
    let startValue: number;
    let endValue: number;
    if (dutyString === '10:00 AM - 7:00 PM') {
      startValue = 10;
      endValue = 19;
      startHour = '10:00';
      endHour = '19:00';
    } else if (dutyString === '08:00 AM - 5:00 PM') {
      startValue = 8;
      endValue = 17;
      startHour = '08:00';
      endHour = '17:00';
    } else {
      startValue = 12;
      endValue = 21;
      startHour = '12:00';
      endHour = '21:00';
    }
    data.WorkDays.forEach((item: Record<string, any>) => {
      item.WorkStartHour = new Date(new Date(item.WorkStartHour).setHours(startValue));
      item.WorkEndHour = new Date(new Date(item.WorkEndHour).setHours(endValue));
      item.BreakStartHour = new Date(item.BreakStartHour);
      item.BreakEndHour = new Date(item.BreakEndHour);
    });
    data.StartHour = startHour;
    data.EndHour = endHour;
    return data;
  }

  public resetFormFields(): void {
    const formElement: HTMLInputElement[] = [].slice.call(document.querySelectorAll('.new-agency-dialog .e-field'));
    this.dataService.destroyErrorElement(document.querySelector('#new-agency-form'), formElement);
    for (const curElement of formElement) {
      let columnName: string = curElement.querySelector('input').name;
      const isCustomElement: boolean = curElement.classList.contains('e-ddl');
      if (!isNullOrUndefined(columnName) || isCustomElement) {
        if (columnName === '' && isCustomElement) {
          columnName = curElement.querySelector('select').name;
          const instance: DropDownList = (curElement.parentElement as EJ2Instance).ej2_instances[0] as DropDownList;
          instance.value = (instance as any).dataSource[0];
        } 
         else if(columnName === 'Mobile') {
          ((curElement.parentElement as EJ2Instance).ej2_instances[0] as MaskedTextBox).value = '';
        } else {
          curElement.querySelector('input').value = '';
        }
      }
    }
  }



  public showDetails(): void {
    this.dialogState = 'edit';
    this.title = 'Edit agency';
    this.newagencyObj.show();
    this.activeagencyData = this.dataService.getActiveagencyData();
    const obj: Record<string, any> = this.activeagencyData;
    const formElement: HTMLInputElement[] = [].slice.call(document.querySelectorAll('.new-agency-dialog .e-field'));
    for (const curElement of formElement) {
      let columnName: string = curElement.querySelector('input').name;
      const isCustomElement: boolean = curElement.classList.contains('e-ddl');
      if (!isNullOrUndefined(columnName) || isCustomElement) {
        if (columnName === '' && isCustomElement) {
          columnName = curElement.querySelector('select').name;
          const instance: DropDownList = (curElement.parentElement as EJ2Instance).ej2_instances[0] as DropDownList;
          instance.value = obj[columnName] as string;
          instance.dataBind();
        }
         else if (columnName === 'Mobile') {
          ((curElement.parentElement as EJ2Instance).ej2_instances[0] as MaskedTextBox).value =
            obj[columnName].replace(/[ -.*+?^${}()|[\]\\]/g, '');
        } else {
          curElement.querySelector('input').value = obj[columnName] as string;
        }
      }
    }
  }

  public onBeforeOpen(args: BeforeOpenEventArgs): void {
    const formElement: HTMLFormElement = args.element.querySelector('#new-agency-form');
    if (formElement && formElement.ej2_instances) {
      return;
    }
    const customFn: (args: { [key: string]: HTMLElement }) => boolean = (e: { [key: string]: HTMLElement }) => {
      const argsLength = ((e.element as EJ2Instance).ej2_instances[0] as MaskedTextBoxComponent).value.length;
      return (argsLength !== 0) ? argsLength >= 10 : false;
    };
    const rules: Record<string, any> = {};
    rules.Name = { required: [true, 'Enter valid name'] };
    rules.Mobile = { required: [customFn, 'Enter valid mobile number'] };
    rules.Email = { required: [true, 'Enter valid email'], email: [true, 'Email address is invalid'] };
    rules.Education = { required: [true, 'Enter valid education'] };
    this.dataService.renderFormValidator(formElement, rules, this.newagencyObj.element);
  }
}
