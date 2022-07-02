/* eslint-disable @typescript-eslint/naming-convention */
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Predicate, Query, DataManager } from '@syncfusion/ej2-data';
import {
  CategoryService, DataLabelService, DateTimeService, SplineSeriesService, DateTimeCategoryService, LegendService
} from '@syncfusion/ej2-angular-charts';
import { addDays, getWeekFirstDate, resetTime } from '@syncfusion/ej2-angular-schedule';
import { DataService } from '../data.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  providers: [CategoryService, DataLabelService, SplineSeriesService, LegendService, DateTimeService, DateTimeCategoryService],
  encapsulation: ViewEncapsulation.None
})
export class DashboardComponent implements OnInit {
  public hospitalData: Record<string, any>[];
  public agencysData: Record<string, any>[];
  public usersData: Record<string, any>[];
  public gridData: Record<string, any>[] = [];
  public primaryXAxis: Record<string, any>;
  public chartData: Record<string, any>[] = [];
  public title: string;
  public primaryYAxis: Record<string, any>;
  public marker: Record<string, any>;
  public legendSettings: Record<string, any>;
  public titleStyle: Record<string, any>;
  public chartArea: Record<string, any>;
  public chartData1: Record<string, any>[] = [];
  public chartData2: Record<string, any>[] = [];
  public initialChartLoad = true;
  time = new Date();
  currTime = this.time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
  constructor(private dataService: DataService) { }

  public ngOnInit(): void {
    this.dataService.updateActiveItem('dashboard');
    this.hospitalData = this.dataService.getHospitalData();
    this.agencysData = this.dataService.getagencysData();
    this.usersData = this.dataService.getusersData();
    const startDate: Date = this.dataService.selectedDate;
    const firstDayOfWeek: Date = getWeekFirstDate(startDate, this.dataService.calendarSettings.firstDayOfWeek);
    const currentDayEvents: Record<string, any>[] = this.getFilteredData(startDate,
      addDays(new Date(startDate.getTime()), 1)) as Record<string, any>[];
    const currentViewEvents: Record<string, any>[] = this.getFilteredData(firstDayOfWeek,
      addDays(new Date(firstDayOfWeek.getTime()), 6));
    document.querySelector('.week-event-count').textContent = currentViewEvents.length.toString();
    document.querySelector('.day-event-count').textContent = currentDayEvents.length.toString();
    // Chart Control Code
    const financeAdvisorData: Record<string, any>[] = currentViewEvents.filter((item: Record<string, any>) => item.DepartmentId === 5);
    // const agencyConsulData: Record<string, any>[] = currentViewEvents.filter((item: Record<string, any>) => item.DepartmentId === 4);
    const counsellingData: Record<string, any>[] = currentViewEvents.filter((item: Record<string, any>) => item.DepartmentId === 6);
    let date: Date = firstDayOfWeek;
    for (let i = 0; i < 7; i++) {
      this.chartData.push(this.getChartData(financeAdvisorData, date));
      // this.chartData1.push(this.getChartData(agencyConsulData, date));
      this.chartData2.push(this.getChartData(counsellingData, date));
      date = addDays(new Date(date.getTime()), 1);
    }
    this.marker = { visible: true, width: 10, height: 10 };
    this.title = 'Consultation Type';
    this.chartArea = { border: { width: 0 } };
    this.titleStyle = { textAlignment: 'Near' };
    this.primaryXAxis = {
      valueType: 'DateTime',
      title: 'Date',
      interval: 1,
      intervalType: 'Days',
      labelFormat: 'MM/dd',
      minimum: firstDayOfWeek,
      maximum: new Date(addDays(new Date(firstDayOfWeek.getTime()), 6)),
      majorGridLines: { width: 0 },
      minorGridLines: { width: 0 },
      majorTickLines: { width: 0 },
      edgeLabelPlacement: 'Shift'
    };
    this.primaryYAxis = {
      title: 'User',
      minimum: 0,
      maximum: 6,
      interval: 2
    };
    this.legendSettings = {
      visible: true,
      position: 'Top',
      padding: 20
    };
    // Grid Data Preparation
    for (const eventData of currentDayEvents) {
      if (eventData) {
        const filteredusers: Record<string, any>[] = this.usersData.filter(item => item.Id === eventData.userId);
        const filteredagencys: Record<string, any>[] = this.agencysData.filter(item => item.Id === eventData.agencyId);
        if (filteredusers.length > 0 && filteredagencys.length > 0) {
          const newData: Record<string, any> = {
            Time: this.getDate(eventData.StartTime),
            Name: filteredusers[0].Name,
            agencyName: filteredagencys[0].Name,
            city: eventData.city,
            agencyId: filteredagencys[0].Id
          };
          this.gridData.push(newData);
        }
      }
    }
  }

  public getChartData(data: Record<string, any>[], startDate: Date): Record<string, any> {
    const filteredData: Record<string, any>[] = data.filter((item: { [key: string]: Date }) =>
      resetTime(startDate).getTime() === resetTime(new Date(item.StartTime)).getTime());
    return { Date: startDate, EventCount: filteredData.length };
  }

  public getFilteredData(startDate: Date, endDate: Date): Record<string, any>[] {
    const predicate: Predicate = new Predicate('StartTime', 'greaterthanorequal', startDate)
      .and(new Predicate('EndTime', 'greaterthanorequal', startDate))
      .and(new Predicate('StartTime', 'lessthan', endDate))
      .or(new Predicate('StartTime', 'lessthanorequal', startDate)
        .and(new Predicate('EndTime', 'greaterthan', startDate)));
    const filter: Record<string, any>[] = new DataManager({ json: this.hospitalData }).executeLocal(new Query().where(predicate));
    return filter;
  }

  public getDate(date: Date): string {
    const d: Date = new Date(date);
    const tempHour: number = (d.getHours() === 0) ? 12 : (d.getHours() < 10) ? d.getHours() : (d.getHours() > 12) ?
      Math.abs(12 - d.getHours()) : d.getHours();
    const hour: string = (tempHour < 10) ? '0' + tempHour : tempHour.toString();
    const minutes: string = (d.getMinutes() < 10) ? '0' + d.getMinutes() : d.getMinutes().toString();
    const l: string = (d.getHours() >= 12) ? 'PM' : 'AM';
    return hour + ':' + minutes + ' ' + l;
  }
}
