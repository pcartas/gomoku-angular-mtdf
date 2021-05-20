import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import { DashboardComponent } from '../dashboard/dashboard.component';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.sass']
})
export class DialogComponent implements OnInit {

  public title: any;
  public secondTitle: any;
  public message: any;
  public button1: any;
  public button2: any;
  public actions: any;
  public textClass: any;

  constructor(public dialogRef: MatDialogRef<DashboardComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.title = data.title;
    this.secondTitle = data.secondTitle;
    this.message = data.message;
    this.button1 = data.buttons[0];
    this.button2 = data.buttons[1];
    this.actions = data.actions;
    this.textClass = data.textClass;
  }

  ngOnInit(): void {
  }

  button1Click(){
    this.dialogRef.close(this.actions[0])
  }

}
