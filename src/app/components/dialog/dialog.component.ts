import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.sass']
})
export class DialogComponent implements OnInit {

  public button1: any;
  public button2: any;
  public title: any;
  public secondTitle: any;
  public message: any;
  public textClass: any;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.title = data.title;
    this.secondTitle = data.secondTitle;
    this.message = data.message;
    this.button1 = data.buttons[0];
    this.button2 = data.buttons[1];
    this.textClass = data.textClass;
  }

  ngOnInit(): void {
  }

}
