import { sanitizeIdentifier } from '@angular/compiler';
import { Component, OnInit } from '@angular/core';
import {CellComponent} from '../cell/cell.component';
import {Player} from '../Player';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.sass']
})
export class DashboardComponent implements OnInit {
  private WIN_CONDITION: number = 5;
  public winner: Player = Player.PLAYER_NONE;
  private FirstPlayerCells: CellComponent[] = [];
  private SecondPlayerCells: CellComponent[] = [];
  private lastPlayer: Player;
  public gameBoard;

  constructor() { }

  ngOnInit(): void {
    // creando tablero de 15x15 donde cada celda es un CellComponent
    this.gameBoard = () => {
      var size = 15;
      let newGameState : CellComponent[][] = [];
      for(var i: number = 0; i < size; i++){
        newGameState[i] = [];
        for(var j: number = 0; j < size; j++){
          newGameState[i][j] = new CellComponent(i,j);
        }
      }
      return newGameState;
    }

    


  }

}
