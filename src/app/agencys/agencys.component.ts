import { Component, ViewChild, ViewEncapsulation, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DropDownListComponent } from '@syncfusion/ej2-angular-dropdowns';
import { AddEditagencyComponent } from '../add-edit-agency/add-edit-agency.component';
import { DataService } from '../data.service';
import { Tooltip, TooltipEventArgs } from '@syncfusion/ej2-angular-popups';

@Component({
  selector: 'app-agencys',
  templateUrl: './agencys.component.html',
  styleUrls: ['./agencys.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class agencysComponent implements OnInit {
  @ViewChild('addEditagencyObj') addEditagencyObj: AddEditagencyComponent;
  @ViewChild('specializationObj') specializationObj: DropDownListComponent;
  @ViewChild('specialistItemObj') specialistItemObj: any;

  public agencysData: Record<string, any>[];
  public activeagencyData: Record<string, any>;
  public filteredagencys: Record<string, any>[];
  public specializationData: Record<string, any>[];
  public fields: Record<string, any> = { text: 'Text', value: 'Id' };
  public selectedDepartmentId: string;
  public tooltipObj: Tooltip;

  constructor(public dataService: DataService, private router: Router) {
    this.agencysData = this.filteredagencys = this.dataService.getagencysData();
    this.activeagencyData = this.agencysData[0];
    this.specializationData = this.dataService.specialistData;
  }

  public ngOnInit(): void {
    this.dataService.updateActiveItem('agencys');
    this.tooltipObj = new Tooltip({
      height: '30px',
      width: '76px',
      position: 'RightTop',
      offsetX: -10,
      showTipPointer: false,
      target: '.availability',
      beforeOpen: (args: TooltipEventArgs) => {
        args.element.querySelector('.e-tip-content').textContent =
          args.target.classList[1].charAt(0).toUpperCase() + args.target.classList[1].slice(1);
      }
    });
    if (this.specialistItemObj) {
      this.tooltipObj.appendTo(this.specialistItemObj.nativeElement);
    }
  }

  public getColor(args: Record<string, string>): string {
    return args.Color;
  }

  public onSpecializationChange(args?: Record<string, any>): void {
    let filteredData: Record<string, any>[];
    if (args && args.value) {
      this.selectedDepartmentId = args ? args.itemData.DepartmentId : this.selectedDepartmentId;
      filteredData = this.agencysData.filter((item: any) => item.DepartmentId === this.selectedDepartmentId);
    } else {
      this.selectedDepartmentId = null;
      filteredData = this.agencysData;
    }
    this.filteredagencys = filteredData;
  }

  public onSpecialistClick(args: Record<string, any>): void {
    this.tooltipObj.close();
    const specialistId: string = args.currentTarget.querySelector('.specialist-item').id.split('_')[1];
    const filteredData: Record<string, any>[] = this.agencysData.filter((item: any) => item.Id === parseInt(specialistId as string, 10));
    this.dataService.setActiveagencyData(filteredData[0]);
    this.router.navigateByUrl('/agency-details/' + specialistId);
  }

  public onAddagency(): void {
    this.addEditagencyObj.onAddagency();
  }

  public updateagencys(): void {
    this.agencysData = this.dataService.getagencysData();
    if (this.selectedDepartmentId) {
      this.filteredagencys = this.agencysData.filter((item: any) => item.DepartmentId === this.selectedDepartmentId);
    }
  }

  public getEducation(text: string): string {
    return text.toUpperCase();
  }
}
