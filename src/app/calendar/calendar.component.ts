/* eslint-disable @typescript-eslint/naming-convention */
import { Component, ViewEncapsulation, ViewChild, OnInit } from '@angular/core';
import {
  remove, addClass, closest, Browser, L10n, Internationalization, extend, isNullOrUndefined, createElement
} from '@syncfusion/ej2-base';
import { Query, Predicate, DataManager } from '@syncfusion/ej2-data';
import { ToastComponent } from '@syncfusion/ej2-angular-notifications';
import { Button, CheckBox } from '@syncfusion/ej2-angular-buttons';
import { DialogComponent } from '@syncfusion/ej2-angular-popups';
import { ChangeEventArgs } from '@syncfusion/ej2-angular-inputs';
import { ItemModel, TreeViewComponent, DragAndDropEventArgs } from '@syncfusion/ej2-angular-navigations';
import {
  DayService, WeekService, WorkWeekService, MonthService, AgendaService, TimelineViewsService,
  TimelineMonthService, ResizeService, DragAndDropService, EventSettingsModel, ActionEventArgs,
  ScheduleComponent, CellClickEventArgs, TimeScaleModel, GroupModel,
  PopupOpenEventArgs, EJ2Instance, getWeekFirstDate, addDays, NavigatingEventArgs, WorkHoursModel
} from '@syncfusion/ej2-angular-schedule';
import { QuickPopups } from '@syncfusion/ej2-schedule/src/schedule/popups/quick-popups';
import { FieldValidator } from '@syncfusion/ej2-schedule/src/schedule/popups/form-validator';
import { DropDownList, ComboBox } from '@syncfusion/ej2-angular-dropdowns';
import { AddEditUserComponent } from '../add-edit-user/add-edit-user.component';
import { AddEditagencyComponent } from '../add-edit-agency/add-edit-agency.component';
import { CalendarSettings } from '../calendar-settings';
import { DataService } from '../data.service';

L10n.load({
  'en-US': {
    schedule: {
      newEvent: 'Add Appointment',
      editEvent: 'Edit Appointment'
    }
  }
});

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  providers: [
    DayService, WeekService, WorkWeekService, MonthService, AgendaService, TimelineViewsService,
    TimelineMonthService, ResizeService, DragAndDropService
  ],
  encapsulation: ViewEncapsulation.None
})
export class CalendarComponent implements OnInit {

  @ViewChild('addEdituserObj') addEdituserObj: AddEditUserComponent;
  @ViewChild('addEditagencyObj') addEditagencyObj: AddEditagencyComponent;
  @ViewChild('scheduleObj') scheduleObj: ScheduleComponent;
  @ViewChild('treeObj') treeObj: TreeViewComponent;
  @ViewChild('specialistObj') specialistObj: DialogComponent;
  @ViewChild('dropdownObj') dropdownObj: DropDownList;
  @ViewChild('waitingObj') waitingObj: DialogComponent;
  @ViewChild('calendarToast') toastObj: ToastComponent;

  public position: Record<string, any> = { X: 'Right', Y: 'Bottom' };
  public toastContent: string;
  public toastWidth = '580px';
  public calendarSettings: CalendarSettings;
  public isTreeItemDropped = false;
  public draggedItemId = '';
  public userValue: number;
  public group: GroupModel = { enableCompactView: false, resources: ['Departments', 'agencys'] };
  public field: Record<string, any> = { dataSource: [], id: 'Id', text: 'Name' };
  public dropFields: Record<string, any> = { text: 'Name', value: 'Id' };
  public allowDragAndDrop = true;
  public instance: Internationalization = new Internationalization();
  public initialLoad = true;
  public currentDate: Date;
  public selectedDate: Date;
  public eventSettings: EventSettingsModel;
  public resourceDataSource: Record<string, any>[];
  public specialistCategory: Record<string, any>[];
  public firstDayOfWeek = 1;
  public startHour: string;
  public endHour: string;
  public timeScale: TimeScaleModel = { enable: true, interval: 60 };
  public currentView: string;
  public agencysData: Record<string, any>[];
  public hospitalData: Record<string, any>[];
  public usersData: Record<string, any>[];
  public activeagencyData: Record<string, any>[];
  public specialistData: Record<string, any>[];
  public data: any = [];
  public eventData: Record<string, any>[];
  public workDays: Array<number> = [0, 1, 2, 3, 4, 5, 6];
  public workHours: WorkHoursModel = { start: '08:00', end: '21:00' };
  public animationSettings: Record<string, any> = { effect: 'None' };
  public waitingList: Record<string, any>[];
  public activeWaitingItem: Record<string, any>[] = [];
  public selectedWaitingItem: Record<string, any>[] = [];
  public comboBox: ComboBox;
  public fields: Record<string, any> = { text: 'Name', value: 'Id' };
  public itemTemplate: string = '<div class="specialist-item"><img class="value" src="./assets/images/${Text}.png" alt="agency"/>' +
    '<div class="agency-details"><div class="name">${Name}</div><div class="designation">${Designation}</div></div></div>';
  public footerTemplate = `<div class="add-agency"><div class="e-icon-add e-icons"></div>
    <div class="add-agency-text">Add New Agency</div></div>`;

  constructor(public dataService: DataService) {
    (QuickPopups.prototype as any).applyFormValidation = () => { };
    (FieldValidator.prototype as any).errorPlacement = this.dataService.errorPlacement;
  }

  public minValidation: (args: { [key: string]: string }) => boolean = (args: { [key: string]: string }) => args.value.length >= 5;
  public nameValidation: (args: { [key: string]: string }) => boolean = (args: { [key: string]: string }) =>
    this.usersData.filter((item: Record<string, any>) => item.Name === args.value).length > 0;

  public ngOnInit(): void {
    this.eventData = this.hospitalData = this.dataService.getHospitalData();
    this.calendarSettings = this.dataService.getCalendarSettings();
    this.eventSettings = {
      dataSource: this.eventData,
      query: new Query(),
      fields: {
        subject: {
          name: 'Name',
          validation: {
            required: [true, 'Enter valid Name'],
            range: [this.nameValidation, 'Entered name is not present, please add new user or select from list']
          }
        },
        startTime: { title: 'From', validation: { required: true } },
        endTime: { title: 'To', validation: { required: true } },
        description: {
          name: 'city',
          title: 'Any Notes',
          validation: {
            required: [false],
            minLength: [this.minValidation, 'Need atleast 5 letters to be entered']
          }
        }
      },
      resourceColorField: this.calendarSettings.bookingColor
    };
    this.dataService.updateActiveItem('calendar');
    this.usersData = this.dataService.getusersData();
    this.specialistCategory = this.dataService.specialistData;
    this.activeagencyData = [];
    this.specialistData = this.agencysData = this.dataService.getagencysData();
    this.resourceDataSource = this.dataService.getagencysData();
    this.field.dataSource = this.waitingList = this.dataService.getWaitingList();
    this.activeWaitingItem = this.waitingList;
    this.startHour = this.calendarSettings.calendar.start as string;
    this.endHour = this.calendarSettings.calendar.end as string;
    this.timeScale.interval = this.calendarSettings.interval;
    this.currentView = this.calendarSettings.currentView;
    this.firstDayOfWeek = this.calendarSettings.firstDayOfWeek;
    this.selectedDate = this.dataService.selectedDate;
    this.currentDate = this.selectedDate;
    if (this.specialistObj) {
      this.specialistObj.hide();
    }
    if (Browser.isDevice && this.dropdownObj) {
      this.toastWidth = '300px';
      addClass([this.dropdownObj.element], 'e-specialist-hide');
    }
  }

  public onActionBegin(args: ActionEventArgs): void {
    if (args.requestType === 'eventCreate' || args.requestType === 'eventChange') {
      if (this.isTreeItemDropped) {
        const treeViewData: Record<string, any>[] =
          this.treeObj.fields.dataSource as Record<string, any>[];
        this.refreshWaitingItems(parseInt(this.draggedItemId, 10));
        this.treeObj.fields.dataSource = treeViewData.filter((item: Record<string, any>) =>
          item.Id !== parseInt(this.draggedItemId, 10));
        const elements: NodeListOf<HTMLElement> = document.querySelectorAll('.e-drag-item.treeview-external-drag');
        elements.forEach((node: HTMLElement) => remove(node));
      }
      const data: Record<string, any> = (args.requestType === 'eventCreate' ? (args.data as Record<string, any>[])[0] :
        (args.changedRecords as Record<string, any>[])[0]);
      if (this.userValue) {
        data.userId = this.userValue;
        data.Name = this.usersData.filter((item: Record<string, any>) => item.Id === this.userValue)[0].Name;
      }
      let eventCollection: Record<string, any>[] = this.scheduleObj.eventBase.filterEvents(data.StartTime as Date, data.EndTime as Date);
      const predicate: Predicate = new Predicate('Id', 'notequal', data.Id as number)
        .and(new Predicate('DepartmentId', 'equal', data.DepartmentId as number))
        .and(new Predicate('agencyId', 'equal', data.agencyId as number))
        .and(new Predicate('Id', 'notequal', data.RecurrenceID as number));
      eventCollection = new DataManager({ json: eventCollection }).executeLocal(new Query().where(predicate));
      if (eventCollection.length > 0) {
        args.cancel = true;
        this.toastContent = 'An appointment already exists on the same time range, so please reschedule on different time slots.';
        if (args.requestType !== 'eventChange') {
          this.waitingList.push(data);
          this.toastContent = 'An appointment already exists on the same time range, so it is added to the waiting list';
        }
        this.toastObj.show();
      }
      if (this.activeagencyData.length > 0) {
        this.updateWaitingList(this.activeagencyData[0].DepartmentId);
      } else {
        this.updateWaitingList();
      }
      if (args.requestType === 'eventCreate') {
        if (this.isTreeItemDropped && this.activeagencyData.length > 0) {
          this.hospitalData.push(data);
        }
      }
      const activityData: Record<string, any> = {
        Name: args.requestType === 'eventCreate' ? 'Added New Appointment' : 'Updated Appointment',
        Message: `${data.Name} for ${data.city}`,
        Time: '5 mins ago',
        Type: 'appointment',
        ActivityTime: new Date()
      };
      this.dataService.addActivityData(activityData);
      this.isTreeItemDropped = false;
    }
    if (args.requestType === 'toolbarItemRendering') {
      if (Browser.isDevice) {
        const agencyIcon: ItemModel = {
          align: 'Center',
          cssClass: 'app-agency-icon',
          overflow: 'Show',
          prefixIcon: 'agency-icon',
          showAlwaysInPopup: true
        };
        args.items.unshift(agencyIcon);
        const waitingListItem: ItemModel = {
          align: 'Right',
          cssClass: 'app-waiting-list',
          showAlwaysInPopup: true,
          text: 'Waiting list',
          click: this.onWaitingListSelect.bind(this)
        };
        args.items.push(waitingListItem);
        args.items.splice(5, 1);
      } else {
        const specialistItem: ItemModel = { align: 'Center', cssClass: 'app-agencys' };
        args.items.unshift(specialistItem);
        args.items.splice(4, 2);
      }
    }
  }

  public onActionComplete(args: ActionEventArgs): void {
    if (args.requestType === 'toolBarItemRendered') {
      if (Browser.isDevice) {
        const agencyIconContainer: HTMLElement = this.scheduleObj.element.querySelector('.app-agency-icon') as HTMLElement;
        const agencyIcon: HTMLElement = agencyIconContainer.querySelector('.agency-icon');
        const agencyImage: HTMLElement = createElement('img', { className: 'active-agency', attrs: { src: './assets/Icons/agencys.svg' } });
        agencyIcon.appendChild(agencyImage);
        agencyIconContainer.style.display = 'block';
        agencyIconContainer.onclick = () => this.specialistObj.show();
      }
    }
    if (document.body.style.cursor === 'not-allowed') {
      document.body.style.cursor = '';
    }
    if (args.requestType === 'eventCreated' || args.requestType === 'eventChanged' || args.requestType === 'eventRemoved') {
      this.dataService.addHospitalData(this.hospitalData);
    }
  }

  public onPopupOpen(args: PopupOpenEventArgs): void {
    if (args.type === 'Editor') {
      // additional field customization
      if (!args.element.querySelector('.custom-field-row')) {
        const row: HTMLElement = createElement('div', { className: 'custom-field-row' });
        const formElement: HTMLElement = args.element.querySelector('.e-schedule-form');
        formElement.firstChild.insertBefore(row, args.element.querySelector('.e-title-location-row'));
        const container: HTMLElement = createElement('div', { className: 'custom-field-container' });
        const comboBoxElement: HTMLInputElement = createElement('input', { attrs: { id: 'userName' } }) as HTMLInputElement;
        container.appendChild(comboBoxElement);
        row.appendChild(container);
        this.comboBox = new ComboBox({
          dataSource: this.usersData,
          allowFiltering: true,
          fields: { text: 'Name', value: 'Id' },
          floatLabelType: 'Always',
          placeholder: 'USER NAME',
          change: (e: any) => this.userValue = e.value,
          select: () => {
            if (!isNullOrUndefined(document.querySelector('.custom-field-row .field-error'))) {
              (document.querySelector('.custom-field-row .field-error') as HTMLElement).style.display = 'none';
            }
          }
        });
        this.comboBox.appendTo(comboBoxElement);
        comboBoxElement.setAttribute('name', 'Name');
        const buttonEle: HTMLInputElement = createElement('button', { attrs: { name: 'userButton' } }) as HTMLInputElement;
        buttonEle.onclick = this.onAdduser.bind(this);
        container.appendChild(buttonEle);
        const button: Button = new Button({ iconCss: 'e-icons e-add-icon', cssClass: 'e-small e-round', isPrimary: true });
        button.appendTo(buttonEle);
      }
      this.comboBox.value = args.data.userId || null;
    }
    if (args.type === 'QuickInfo') {
      if (args.target.classList.contains('e-work-cells') || args.target.classList.contains('e-header-cells')) {
        this.scheduleObj.closeQuickInfoPopup();
        args.cancel = true;
      } else if (args.target.classList.contains('e-appointment')) {
        (args.element as HTMLElement).style.boxShadow = `1px 2px 5px 0 ${(args.target as HTMLElement).style.backgroundColor}`;
      }
    }
    if (args.type === 'EventContainer') {
      const eventElements: NodeListOf<HTMLElement> = args.element.querySelectorAll('.e-appointment');
      eventElements.forEach((element: HTMLElement) => { (element.querySelector('.e-subject') as HTMLElement).style.color = '#fff'; });
    }
  }

  public onEventRendered(args: Record<string, any>): void {
    if (args.element.classList.contains('e-appointment')) {
      const data: Record<string, any> = args.data as Record<string, any>;
      const eventStart = data.StartTime as Date;
      const eventEnd = data.EndTime as Date;
      let eventCollection = this.scheduleObj.blockProcessed;
      eventCollection = this.scheduleObj.eventBase.filterEvents(eventStart, eventEnd, eventCollection);
      if (eventCollection.length > 0) {
        args.cancel = true;
        return;
      }
      args.element.style.color = '#fff';
    }
  }

  public onDataBound(): void {
    if (this.initialLoad) {
      this.updateWaitingList();
      this.initialLoad = !this.initialLoad;
    }
  }

  public onAdduser(): void {
    this.addEdituserObj.onAdduser();
  }

  public getEventDetails(data: Record<string, any>): string {
    return (this.instance.formatDate(new Date(data.StartTime), { type: 'date', skeleton: 'long' }) +
      '(' + this.getString(new Date(data.StartTime), 'hm') + '-' + this.getString(new Date(data.EndTime), 'hm') + ')');
  }

  public getuserName(data: Record<string, any>): string {
    return this.usersData.filter((item: Record<string, any>) => item.Id === data.userId)[0].Name.toString();
  }

  public getagencyName(data: Record<string, any>): string {
    if (!isNullOrUndefined(data.agencyId)) {
      return this.agencysData.filter((item: Record<string, any>) => item.Id === data.agencyId)[0].Name.toString() + ' ' + this.agencysData.filter((item: Record<string, any>) => item.Id === data.agencyId)[0].Designation.toString();
    } else {
      return this.specialistCategory.filter((item: Record<string, any>) => item.DepartmentId === data.DepartmentId)[0].Text.toString();
    }
  }

  public getDepartmentName(id: number): string {
    return (this.specialistCategory.filter(item => id === item.DepartmentId)[0].Text as string).toUpperCase();
  }

  public getTreatmentDetail(data: Record<string, any>): string {
    return data.Treatment || ' ';
  }

  // Toolbar item actions
  public onMultiSelectOpen(args: any): void {
    args.popup.element.querySelector('.add-agency').onclick = this.onAddClick.bind(this);
  }

  public onagencySelect(args: Record<string, any>): void {
    if (args.value) {
      this.refreshDataSource(args.itemData.DepartmentId, args.itemData.Id);
      this.field.dataSource = this.activeWaitingItem;
      this.treeObj.fields.dataSource = this.activeWaitingItem as Record<string, any>[];
    } else {
      this.setDefaultData();
    }
  }

  public refreshDataSource(deptId: string, agencyId: string): void {
    const filteredItems: Record<string, any>[] = this.agencysData.filter(item => parseInt(agencyId, 10) === item.Id);
    this.activeagencyData = filteredItems;
    this.workDays = filteredItems[0].AvailableDays;
    this.workHours = { start: filteredItems[0].StartHour, end: filteredItems[0].EndHour };
    this.scheduleObj.workHours = this.workHours;
    if (filteredItems.length > 0) {
      this.updateBreakHours(this.scheduleObj.selectedDate);
      this.eventData = this.generateEvents(this.activeagencyData[0]);
    } else {
      this.eventData = this.hospitalData;
    }
    this.scheduleObj.resources[0].query = new Query().where('DepartmentId', 'equal', parseInt(deptId, 10));
    this.scheduleObj.resources[1].query = new Query().where('Id', 'equal', parseInt(agencyId, 10));
    this.scheduleObj.eventSettings.dataSource = this.eventData;
    this.updateWaitingList(parseInt(deptId, 10));
  }

  public onAddClick(): void {
    this.addEditagencyObj.onAddagency();
  }

  public onItemDrag(event: any): void {
    if (this.scheduleObj.isAdaptive) {
      const classElement: HTMLElement = this.scheduleObj.element.querySelector('.e-device-hover');
      if (classElement) {
        classElement.classList.remove('e-device-hover');
      }
      if (event.target.classList.contains('e-work-cells')) {
        addClass([event.target], 'e-device-hover');
      }
    }
    if (document.body.style.cursor === 'not-allowed') {
      document.body.style.cursor = '';
    }
    if (event.name === 'nodeDragging') {
      const tooltipElement: NodeListOf<HTMLElement> = document.querySelectorAll('.e-drag-item.e-treeview');
      let status: boolean;
      tooltipElement.forEach((node: HTMLElement) => {
        node.style.display = 'block';
        status = document.querySelector('body').offsetWidth <= node.offsetLeft + node.offsetWidth;
      });
      const targetEle: Element = closest(event.target, '.droppable');
      if (!targetEle || status) {
        tooltipElement.forEach((node: HTMLElement) => node.style.display = 'none');
        event.cancel = true;
        return;
      }
      const dragElementIcon: NodeListOf<HTMLElement> = document.querySelectorAll('.e-drag-item.treeview-external-drag .e-icon-expandable');
      dragElementIcon.forEach((node: HTMLElement) => node.style.display = 'none');
    }
  }

  public onTreeDragStop(event: DragAndDropEventArgs): void {
    const treeElement: Element = closest(event.target, '.e-treeview');
    const classElement: HTMLElement = this.scheduleObj.element.querySelector('.e-device-hover');
    if (classElement) {
      classElement.classList.remove('e-device-hover');
    }
    const tooltipElement: HTMLElement = document.querySelector('.e-drag-item.e-treeview');
    if (tooltipElement) { tooltipElement.style.display = 'block'; }
    if (!treeElement) {
      if (tooltipElement) { tooltipElement.style.display = 'none'; }
      event.cancel = true;
      const scheduleElement: Element = closest(event.target, '.e-content-wrap');
      if (scheduleElement) {
        const treeviewData: Record<string, any>[] = this.treeObj.fields.dataSource as Record<string, any>[];
        if (event.target.classList.contains('e-work-cells')) {
          const filteredData: Record<string, any>[] = treeviewData.filter((item: Record<string, any>) =>
            item.Id === parseInt(event.draggedNodeData.id as string, 10));
          const cellData: CellClickEventArgs = this.scheduleObj.getCellDetails(event.target);
          let agencyId: number;
          if (this.activeagencyData.length > 0) {
            agencyId = this.activeagencyData[0].Id;
          } else {
            const agency: Record<string, any>[] = this.agencysData.filter((item: Record<string, any>) =>
              item.DepartmentId === filteredData[0].DepartmentId);
            agencyId = agency && agency.length > 0 ? agency[0].Id as number : this.agencysData[0].Id as number;
          }
          const milliSeconds: number = ((filteredData[0].EndTime as Date).getTime() - (filteredData[0].StartTime as Date).getTime());
          const eventData: Record<string, any> = {
            Name: filteredData[0].Name,
            StartTime: cellData.startTime,
            EndTime: new Date(new Date(cellData.startTime).setMilliseconds(milliSeconds)),
            IsAllDay: cellData.isAllDay,
            city: filteredData[0].enite || filteredData[0].city,
            userId: filteredData[0].userId,
            DepartmentId: filteredData[0].DepartmentId,
            agencyId: agencyId
          };
          let eventCollection: Record<string, any>[] = this.scheduleObj.eventBase.filterEvents(eventData.StartTime, eventData.EndTime);
          eventCollection = eventCollection.filter((item: Record<string, any>) => item.agencyId === eventData.agencyId);
          if (eventCollection.length > 0) {
            event.cancel = true;
            this.toastContent = 'An appointment already exists on the same time range, so please reschedule on different time slots.';
            this.toastObj.show();
          } else {
            this.scheduleObj.openEditor(eventData, 'Add', true);
            this.isTreeItemDropped = true;
            this.draggedItemId = event.draggedNodeData.id as string;
          }
        }
      }
    }
  }

  public getEventTime(data: Record<string, any>): string {
    return (this.getString(new Date(data.StartTime), 'MMMd') + ',' + this.getString(new Date(data.StartTime), 'hm') +
      '-' + this.getString(new Date(data.EndTime), 'hm'));
  }

  public getString(value: Date, type: string): string {
    return this.instance.formatDate(new Date(value), { type: 'dateTime', skeleton: type });
  }

  public createNewEvent(e: MouseEvent): void {
    const args = e as CellClickEventArgs & MouseEvent;
    let data: CellClickEventArgs;
    const isSameTime: boolean =
      this.scheduleObj.activeCellsData.startTime.getTime() === this.scheduleObj.activeCellsData.endTime.getTime();
    if (this.scheduleObj.activeCellsData && !isSameTime) {
      data = this.scheduleObj.activeCellsData;
    } else {
      const interval: number = this.scheduleObj.activeViewOptions.timeScale.interval;
      const slotCount: number = this.scheduleObj.activeViewOptions.timeScale.slotCount;
      const msInterval: number = (interval * 60000) / slotCount;
      const startTime: Date = new Date(this.scheduleObj.selectedDate.getTime());
      startTime.setHours(new Date().getHours(), Math.round(startTime.getMinutes() / msInterval) * msInterval, 0);
      const endTime: Date = new Date(new Date(startTime.getTime()).setMilliseconds(startTime.getMilliseconds() + msInterval));
      data = { startTime, endTime, isAllDay: false };
    }
    this.scheduleObj.openEditor(extend(data, { cancel: false, event: args.event }), 'Add');
  }

  public getagencyImage(data: Record<string, any>): string {
    return isNullOrUndefined(data.Text) ? './assets/Icons/agencys.svg' : `./assets/images/${data.Text}.png`;
  }

  public onSpecialistSelect(args: Record<string, any>): void {
    const target: HTMLElement = closest(args.target, '.specialist-item') as HTMLElement;
    const deptId: string = target.getAttribute('data-deptid');
    const agencyId: string = target.getAttribute('data-agencyid');
    this.refreshDataSource(deptId, agencyId);
    const agencyImage: HTMLElement = this.scheduleObj.element.querySelector('.agency-icon .active-agency');
    agencyImage.setAttribute('src', './assets/images/' + this.activeagencyData[0].Text + '.png');
    this.specialistObj.hide();
  }

  public onBackIconClick(args: Record<string, any>): void {
    if (closest(args.currentTarget.parentElement, '.waiting-list-dialog')) {
      this.waitingObj.hide();
    } else {
      this.specialistObj.hide();
    }
  }

  public onWaitingListSelect(): void {
    this.waitingObj.show();
  }

  public onWaitingListClosed(args: Record<string, any>): void {
    const checkboxElements: HTMLElement[] = args.element.querySelectorAll('.e-checkbox');
    checkboxElements.forEach(element => {
      const checkbox: CheckBox = (element as EJ2Instance).ej2_instances[0] as CheckBox;
      if (checkbox.checked) {
        checkbox.checked = false;
      }
    });
  }

  public onItemChecked(args: ChangeEventArgs): void {
    const waitItemId: string = closest(args.event.currentTarget as HTMLElement, '.e-checkbox-wrapper').id;
    this.selectedWaitingItem.push(this.waitingList.filter((item: Record<string, any>) => item.Id === parseInt(waitItemId, 10))[0]);
  }

  public onItemDelete(): void {
    if (this.selectedWaitingItem.length > 0) {
      this.selectedWaitingItem.forEach((activeItem: Record<string, any>) => this.refreshWaitingItems(activeItem.Id as number));
      this.selectedWaitingItem = [];
      this.waitingObj.hide();
    } else {
      this.toastContent = 'Please select the waiting item to delete';
      this.toastObj.show();
    }
  }

  public onItemAdd(): void {
    if (this.selectedWaitingItem.length > 0) {
      this.selectedWaitingItem.forEach((activeItem: Record<string, any>) => {
        const eventFilter: Record<string, any>[] = this.eventData.filter((event: Record<string, any>) => event.Id === activeItem.Id);
        if (eventFilter.length === 0) {
          const agencyData: Record<string, any>[] = this.activeagencyData.length > 0 ?
            this.activeagencyData.filter((data: Record<string, any>) => data.DepartmentId === activeItem.DepartmentId) : [];
          const isActiveDepartment: boolean = agencyData.length > 0;
          if (isActiveDepartment) {
            activeItem.agencyId = agencyData[0].Id;
          } else {
            const filteredData: Record<string, any>[] = this.agencysData.filter((data: Record<string, any>) =>
              data.DepartmentId === activeItem.DepartmentId);
            activeItem.agencyId = filteredData[0].Id;
          }
          this.eventData.push(activeItem);
          this.refreshWaitingItems(activeItem.Id as number);
          if (this.activeagencyData.length > 0) {
            this.hospitalData.push(activeItem);
          }
          this.dataService.addHospitalData(this.hospitalData);
        }
      });
      this.selectedWaitingItem = [];
      this.waitingObj.hide();
      this.scheduleObj.eventSettings.dataSource = this.eventData;
      this.scheduleObj.refreshEvents();
    } else {
      this.toastContent = 'Please select the waiting item to add';
      this.toastObj.show();
    }
    if (this.activeagencyData.length > 0) {
      this.updateWaitingList(this.activeagencyData[0].DepartmentId);
    } else {
      this.updateWaitingList();
    }
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  public getDateHeaderText: Function = (value: Date): string => this.instance.formatDate(value, { skeleton: 'MMMEd' }).toUpperCase();

  public getBackGroundColor(data: Record<string, any>): Record<string, string> {
    let color: string;
    if (this.eventSettings.resourceColorField === 'agencys' && !isNullOrUndefined(data.agencyId)) {
      color = this.agencysData.filter((item: Record<string, any>) => item.Id === data.agencyId)[0].Color as string || '#7575ff';
    } else {
      color = this.specialistCategory.filter((item: Record<string, any>) =>
        item.DepartmentId === data.DepartmentId)[0].Color as string;
    }
    return { 'background-color': color, color: '#FFFFFF' };
  }

  public onNavigation(args: NavigatingEventArgs): void {
    this.currentDate = args.currentDate || this.selectedDate;
    if (this.activeagencyData.length > 0) {
      this.updateBreakHours(this.currentDate);
      this.eventData = this.generateEvents(this.activeagencyData[0]);
      this.scheduleObj.eventSettings.dataSource = this.eventData;
      this.updateWaitingList(this.activeagencyData[0].DepartmentId);
    } else {
      this.updateWaitingList();
    }
  }

  public refreshWaitingItems(id: number): void {
    this.waitingList = this.waitingList.filter((item: any) => item.Id !== id);
    this.dataService.setWaitingList(this.waitingList);
    this.activeWaitingItem = this.waitingList;
  }

  public updateWaitingList(deptId?: number): void {
    let filteredData: Record<string, any>[] = this.filterWaitingEvents();
    if (deptId) {
      filteredData = filteredData.filter((item: Record<string, any>) => item.DepartmentId === deptId);
    }
    this.activeWaitingItem = filteredData;
    this.field.dataSource = this.activeWaitingItem;
    this.treeObj.fields.dataSource = this.activeWaitingItem as Record<string, any>[];
    this.treeObj.refresh();
  }

  public updateBreakHours(currentDate: Date): void {
    const currentViewDates: Date[] = [];
    const firstDayOfWeek: Date = getWeekFirstDate(currentDate, this.firstDayOfWeek as number);
    let startDate: Date = firstDayOfWeek;
    const endDate: Date = addDays(new Date(startDate.getTime()), 7);
    do {
      currentViewDates.push(startDate);
      startDate = addDays(new Date(startDate.getTime()), 1);
    } while (startDate.getTime() !== endDate.getTime());
    currentViewDates.forEach((item: Date) => {
      this.activeagencyData[0].WorkDays.forEach((dayItem: { [key: string]: Date }) => {
        if (dayItem.BreakStartHour.getDay() === item.getDay()) {
          dayItem.BreakStartHour = this.resetDateValue(dayItem.BreakStartHour, item);
          dayItem.BreakEndHour = this.resetDateValue(dayItem.BreakEndHour, item);
          dayItem.WorkStartHour = this.resetDateValue(dayItem.WorkStartHour, item);
          dayItem.WorkEndHour = this.resetDateValue(dayItem.WorkEndHour, item);
        }
      });
    });
  }

  public resetDateValue(date: Date, item: Date): Date {
    return new Date(new Date(date).setFullYear(item.getFullYear(), item.getMonth(), item.getDate()));
  }

  public generateEvents(activeData: Record<string, any>): Record<string, any>[] {
    const filteredEvents: Record<string, any>[] = [];
    const datas: Record<string, any>[] = this.hospitalData.filter((item: any) =>
      item.agencyId === activeData.Id || (Array.isArray(item.agencyId) && item.agencyId.indexOf(activeData.Id) !== -1));
    datas.forEach((element: Record<string, any>) => filteredEvents.push(element));
    activeData.WorkDays.forEach((element: Record<string, any>) => {
      if (element.State !== 'RemoveBreak') {
        const newBreakEvent: Record<string, any> = {
          Id: Math.max.apply(Math, filteredEvents.map((data: Record<string, any>) => data.Id)) + 1,
          Name: 'Break Time',
          StartTime: element.BreakStartHour,
          EndTime: element.BreakEndHour,
          IsBlock: true,
          agencyId: activeData.Id
        };
        filteredEvents.push(newBreakEvent);
      }
      if (element.Enable) {
        const shiftValue: string = activeData.DutyTiming;
        const obj: Record<string, any>[] = [];
        if (shiftValue === 'Shift1') {
          const shiftTiming = {
            startTime: new Date(new Date(element.WorkStartHour).setHours(17)),
            endTime: new Date(new Date(element.WorkEndHour).setHours(21))
          };
          obj.push(shiftTiming);
        } else if (shiftValue === 'Shift2') {
          const shiftTiming1 = {
            startTime: new Date(new Date(element.WorkStartHour).setHours(8)),
            endTime: new Date(new Date(element.WorkEndHour).setHours(10))
          };
          const shiftTiming2 = {
            startTime: new Date(new Date(element.WorkStartHour).setHours(19)),
            endTime: new Date(new Date(element.WorkEndHour).setHours(21))
          };
          obj.push(shiftTiming1);
          obj.push(shiftTiming2);
        } else {
          const shiftTiming = {
            startTime: new Date(new Date(element.WorkStartHour).setHours(8)),
            endTime: new Date(new Date(element.WorkEndHour).setHours(12))
          };
          obj.push(shiftTiming);
        }
        obj.forEach(item => {
          const newBreakEvent: Record<string, any> = {
            Id: Math.max.apply(Math, filteredEvents.map((data: Record<string, any>) => data.Id)) + 1,
            Name: 'Off Work',
            StartTime: item.startTime,
            EndTime: item.endTime,
            IsBlock: true,
            agencyId: activeData.Id
          };
          filteredEvents.push(newBreakEvent);
        });
      }
    });
    return filteredEvents;
  }

  public filterWaitingEvents(): Record<string, any>[] {
    const firstDayOfWeek: Date = getWeekFirstDate(this.currentDate, this.firstDayOfWeek as number);
    return this.scheduleObj.eventBase.filterEvents(firstDayOfWeek, addDays(new Date(firstDayOfWeek.getTime()), 6), this.waitingList);
  }

  public clearSelection(): void {
    this.setDefaultData();
    const agencyImage: HTMLElement = this.scheduleObj.element.querySelector('.agency-icon .active-agency');
    agencyImage.setAttribute('src', './assets/Icons/agencys.svg');
    this.specialistObj.hide();
  }

  public setDefaultData(): void {
    this.scheduleObj.resources[0].dataSource = this.specialistCategory;
    this.scheduleObj.resources[1].dataSource = this.resourceDataSource;
    this.scheduleObj.resources[0].query = new Query();
    this.scheduleObj.resources[1].query = new Query();
    this.eventData = this.hospitalData;
    this.scheduleObj.eventSettings.dataSource = this.eventData;
    this.scheduleObj.refreshEvents();
    this.updateWaitingList();
    this.startHour = this.calendarSettings.calendar.start as string;
    this.endHour = this.calendarSettings.calendar.end as string;
    this.workDays = [0, 1, 2, 3, 4, 5, 6];
    this.workHours = { start: '08:00', end: '21:00' };
    this.scheduleObj.workHours = this.workHours;
    this.activeagencyData = [];
  }
}
