import { Component, OnInit, Input } from '@angular/core';
import { Player } from '../Player';
@Component({
  selector: 'app-cell',
  templateUrl: './cell.component.html',
  styleUrls: ['./cell.component.sass']
})
export class CellComponent implements OnInit {

  playerInstance = Player
  @Input('row') row: number;
  @Input('column') column: number;
  @Input('state') state: number = 0;
  constructor(row: number, column: number) { 
    this.row = row;
    this.column = column;
    this.state = 0;   
  }

  ngOnInit(): void {
  }

  changeState(state: number){
    this.state = state;
  }
}
