import { Component, OnInit, Input, Inject, Injectable } from '@angular/core';
import { Player } from '../Player';
@Component({
  selector: 'app-cell',
  templateUrl: './cell.component.html',
  styleUrls: ['./cell.component.sass']
})

@Injectable({
  providedIn: 'any'
})
export class CellComponent implements OnInit {

  playerInstance = Player
  @Input('row') row: number;
  @Input('column') column: number;
  @Input('state') state: number = 0;
  
  constructor(@Inject('row') row: number, @Inject('column') column: number) { 
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
