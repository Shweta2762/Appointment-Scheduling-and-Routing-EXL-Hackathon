import { Injectable } from '@angular/core';
import {
  usersData, agencysData, specializationData, activityData, hospitalData,
  bloodGroupData, waitingList, shift1BlockData, shift2BlockData, shift3BlockData
} from './datasource';
import { EventFieldsMapping } from '@syncfusion/ej2-schedule';
import { CalendarSettings } from './calendar-settings';
import { FormValidator, FormValidatorModel } from '@syncfusion/ej2-angular-inputs';
import { createElement, remove, removeClass } from '@syncfusion/ej2-base';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  public usersData: Record<string, any>[];
  public agencysData: Record<string, any>[];
  public calendarSettings: CalendarSettings;
  public selectedDate: Date;
  public eventFields: EventFieldsMapping;
  public activeagencyData: Record<string, any>;
  public activeuserData: Record<string, any>;
  public specialistData: Record<string, any>[];
  public activityData: Record<string, any>[];
  public hospitalData: Record<string, any>[];
  public bloodGroupData: Record<string, any>[] = bloodGroupData;
  public waitingList: Record<string, any>[] = waitingList;
  public shift1BlockEvents: Record<string, any>[] = shift1BlockData;
  public shift2BlockEvents: Record<string, any>[] = shift2BlockData;
  public shift3BlockEvents: Record<string, any>[] = shift3BlockData;

  constructor() {
    this.usersData = usersData as Record<string, any>[];
    this.agencysData = agencysData as Record<string, any>[];
    this.calendarSettings = {
      bookingColor: 'agencys',
      calendar: {
        start: '08:00',
        end: '21:00'
      },
      currentView: 'Week',
      interval: 60,
      firstDayOfWeek: 0
    };
    this.selectedDate = new Date(2022, 7, 5);
    this.activeagencyData = this.agencysData[0];
    this.activeuserData = this.usersData[0];
    this.specialistData = specializationData as Record<string, any>[];
    this.activityData = activityData;
    this.hospitalData = hospitalData;
  }

  public onUpdateData(field: string, value: any, className: string, activeData: any): void {
    if (className.indexOf('agency') !== -1) {
      for (const agencyData of this.agencysData) {
        if (agencyData.Id === activeData.Id) {
          agencyData[field] = value;
        }
      }
    } else {
      for (const userData of this.usersData) {
        if (userData.Id === activeData.Id) {
          userData[field] = value;
        }
      }
    }
  }

  public getCalendarSettings(): CalendarSettings {
    return this.calendarSettings;
  }

  public setCalendarSettings(args: CalendarSettings): void {
    this.calendarSettings = args;
  }

  public setActiveagencyData(data: Record<string, any>): void {
    this.activeagencyData = data;
  }

  public getActiveagencyData(): Record<string, any> {
    return this.activeagencyData;
  }

  public setActiveuserData(data: Record<string, any>): void {
    this.activeuserData = data;
  }

  public getActiveuserData(): Record<string, any> {
    return this.activeuserData;
  }

  public setagencysData(data: Record<string, any>[]): void {
    this.agencysData = data;
  }

  public getagencysData(): Record<string, any>[] {
    return this.agencysData;
  }

  public addHospitalData(data: Record<string, any>[]): void {
    this.hospitalData = data;
  }

  public getHospitalData(): Record<string, any>[] {
    return this.hospitalData;
  }

  public setusersData(data: Record<string, any>[]): void {
    this.usersData = data;
  }

  public getusersData(): Record<string, any>[] {
    return this.usersData;
  }

  public addActivityData(data: Record<string, any>): void {
    this.activityData.unshift(data);
  }

  public getActivityData(): Record<string, any>[] {
    return this.activityData;
  }

  public setWaitingList(data: Record<string, any>[]): void {
    this.waitingList = data;
  }

  public getWaitingList(): Record<string, any>[] {
    return this.waitingList;
  }

  public renderFormValidator(formElement: HTMLFormElement, rules: Record<string, any>, parentElement: HTMLElement): void {
    const model: FormValidatorModel = {
      customPlacement: (inputElement: HTMLElement, error: HTMLElement) => { this.errorPlacement(inputElement, error); },
      rules: rules as { [name: string]: { [rule: string]: Record<string, any> } },
      validationComplete: (args: Record<string, any>) => {
        this.validationComplete(args, parentElement);
      }
    };
    const obj: FormValidator = new FormValidator(formElement, model);
  }

  public validationComplete(args: Record<string, any>, parentElement: HTMLElement): void {
    const elem: HTMLElement = parentElement.querySelector('#' + args.inputName + '_Error') as HTMLElement;
    if (elem) {
      elem.style.display = (args.status === 'failure') ? '' : 'none';
    }
  }

  public errorPlacement(inputElement: HTMLElement, error: HTMLElement): void {
    const id: string = error.getAttribute('for');
    const elem: Element = inputElement.parentElement.querySelector('#' + id + '_Error');
    if (!elem) {
      const div: HTMLElement = createElement('div', {
        className: 'field-error',
        id: inputElement.getAttribute('name') + '_Error'
      });
      const content: Element = createElement('div', { className: 'error-content' });
      content.appendChild(error);
      div.appendChild(content);
      inputElement.parentElement.parentElement.appendChild(div);
    }
  }

  public destroyErrorElement(formElement: HTMLFormElement, inputElements: HTMLInputElement[]): void {
    if (formElement) {
      const elements: Element[] = [].slice.call(formElement.querySelectorAll('.field-error'));
      for (const elem of elements) {
        remove(elem);
      }
      for (const element of inputElements) {
        if (element.querySelector('input').classList.contains('e-error')) {
          removeClass([element.querySelector('input')], 'e-error');
        }
      }
    }
  }

  public updateActiveItem(text: string): void {
    const elements: NodeListOf<Element> = document.querySelectorAll('.active-item');
    elements.forEach(element => {
      if (element.classList.contains('active-item')) {
        element.classList.remove('active-item');
      }
    });
    document.querySelector('.sidebar-item.' + text).classList.add('active-item');
  }
}
