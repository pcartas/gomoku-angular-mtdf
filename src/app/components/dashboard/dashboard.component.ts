import { Component, OnInit, ViewChildren, QueryList } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { CellComponent } from '../cell/cell.component';
import { DialogComponent } from '../dialog/dialog.component';
import { Player } from '../../player_enum';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.sass'],
  providers: [
    {
      provide: 'row',
      useValue: 'row',
    },
    {
      provide: 'column',
      useValue: 'column',
    },
  ],
})
export class DashboardComponent implements OnInit {
  //AI Worker variables
  private aiWorker: any;
  private MaximumTimeForMove = 300;
  //Game Variables
  private onGoing: boolean = true;
  private WIN_CONDITION: number = 5;
  private winner: Player = Player.PLAYER_NONE;
  private startPlayer = Player.PLAYER_ONE;
  private iavsia = false;
  //Player Variables
  private FirstPlayerCells: CellComponent[] = [];
  private SecondPlayerCells: CellComponent[] = [];
  private lastPlayer: Player;
  private CurrentPlayer: Player;
  //Board array && Board CellComponent
  private tableSize = 15;
  public gameBoard;
  private Board = [];
  //Undo & Redo variables
  private stack = {};
  private count = 0;
  private redoStack = {};
  private redoCount = 0;

  //ViewChild to query Cell
  @ViewChildren(CellComponent) allCells: QueryList<CellComponent>;

  constructor(private dialogRef: MatDialog) {}

  ngOnInit(): void {
    this.gameBoard = this.newGameState();
    this.CurrentPlayer = this.startPlayer;
    this.initializeWebWorker();
    this.onGoing = true;
    if(this.CurrentPlayer == Player.PLAYER_TWO){
      this.aiWorkerPost(-1);
    }
  }


 //DASHBOARD FUNCTIONS

  newGameState(): any {
    // Making up a NxN dashboard where each cell is a CellComponent
    let newGameState: CellComponent[][] = [];
    for (var i: number = 0; i < this.tableSize; i++) {
      newGameState[i] = [];
      this.Board[i] = [];
      for (var j: number = 0; j < this.tableSize; j++) {
        newGameState[i][j] = new CellComponent(i, j);
        this.Board[i][j] = newGameState[i][j].state;
      }
    }
    return newGameState;
  }

  selectCell(i: number, j: number) {
    if (this.onGoing == false) {
      return null;
    }
    var selectedCell: CellComponent = this.findCorrectCell(i, j);

    if (this.CurrentPlayer !== Player.PLAYER_NONE && this.gameBoard[i][j].state == 0) {

      this.gameBoard[i][j].state = this.CurrentPlayer;
      this.Board[i][j] = this.CurrentPlayer;
      selectedCell.changeState(this.CurrentPlayer);
      var state = this.CurrentPlayer
      this.push({i, j, state});

      // assert winner
      let newCell: CellComponent = new CellComponent(i, j);
      newCell.state = this.CurrentPlayer;
      this.winner = this.addCell(newCell);

      // Swap Player's turn
      this.swapPlayers();
      if (this.CurrentPlayer == Player.PLAYER_TWO) {
         this.aiWorkerPost(-1);
      } else if(this.iavsia == true){
         this.aiWorkerPost(1);
      }

    } else {
      // Nothing happend
      this.openInvalidMoveDialog();
    }

    if (this.winner == 1) {
      this.onGoing = false;
      this.openYouWinDialog();
    } else if (this.winner == -1) {
      this.onGoing = false;
      this.openYouLooseDialog();
    }
  }

  swapPlayers() {
    if (this.CurrentPlayer == Player.PLAYER_ONE) {
      this.CurrentPlayer = Player.PLAYER_TWO;
    } else {
      this.CurrentPlayer = Player.PLAYER_ONE;
    }
  }

  findCorrectCell(i: number, j: number): CellComponent {
    for (var cell of this.allCells.toArray()) {
      if (cell.row == i && cell.column == j) {
        return cell;
      }
    }
    return null;
  }

  addCell(cell: CellComponent): number {
    if (cell.state == Player.PLAYER_ONE) {
      this.FirstPlayerCells.push(cell);

      // Evaluate
      this.lastPlayer = Player.PLAYER_ONE;
      var winYet = this.findWinningSegment(cell, this.FirstPlayerCells);
      if (winYet == true) {
        return 1;
      }

    } else if (cell.state == Player.PLAYER_TWO) {
      this.SecondPlayerCells.push(cell);

      // Evaluate
      this.lastPlayer = Player.PLAYER_TWO;
      var winYet = this.findWinningSegment(cell, this.SecondPlayerCells);

      if (winYet == true) {
        return -1;
      }

    } else {
      return 0;
    }
  }

  findWinningSegment(selectedCell: CellComponent, otherCells: CellComponent[]): boolean {
    // Cells that maybe are part of the solution
    var possibleCandidates: [CellComponent, CellComponent, CellComponent, CellComponent,
      CellComponent, CellComponent, CellComponent, CellComponent];
    possibleCandidates = [new CellComponent(-1, -1), new CellComponent(-1, -1), new CellComponent(-1, -1),
      new CellComponent(-1, -1), new CellComponent(-1, -1), new CellComponent(-1, -1), new CellComponent(-1, -1),
      new CellComponent(-1, -1)
    ];

    // defining same directions, diagonal, vertical, diagonal, horizontal
    var allDirections = [[0, 4], [1, 5], [2, 6], [3, 7]];
    var selectedRow = selectedCell.row;
    var selectedColumn = selectedCell.column;

    //Finding cell for 1 position:
    otherCells.forEach((cell) => {
      if (
        cell.row == selectedRow - 1 &&
        cell.column == selectedColumn - 1 &&
        cell.state == selectedCell.state
      ) {
        // First case => First position (Leftmost-top position)
        possibleCandidates[0] = cell;
      } else if (
        cell.row == selectedRow - 1 &&
        cell.column == selectedColumn &&
        cell.state == selectedCell.state
      ) {
        // Second case => Second position (Middle-top position)
        possibleCandidates[1] = cell;
      } else if (
        cell.row == selectedRow - 1 &&
        cell.column == selectedColumn + 1 &&
        cell.state == selectedCell.state
      ) {
        // Third case => Second position (Rightmost-top position)
        possibleCandidates[2] = cell;
      } else if (
        cell.row == selectedRow &&
        cell.column == selectedColumn + 1 &&
        cell.state == selectedCell.state
      ) {
        // Forth case => Rightmost-middle position)
        possibleCandidates[3] = cell;
      } else if (
        cell.row == selectedRow + 1 &&
        cell.column == selectedColumn + 1 &&
        cell.state == selectedCell.state
      ) {
        // Fifth case => Rightmost-low position)
        possibleCandidates[4] = cell;
      } else if (
        cell.row == selectedRow + 1 &&
        cell.column == selectedColumn &&
        cell.state == selectedCell.state
      ) {
        // Sixthe case => Middle, low position
        // console.log("Somehing wrong...");
        possibleCandidates[5] = cell;
      } else if (
        cell.row == selectedRow + 1 &&
        cell.column == selectedColumn - 1 &&
        cell.state == selectedCell.state
      ) {
        // Seven case => Leftmost, low position
        possibleCandidates[6] = cell;
      } else if (
        cell.row == selectedRow &&
        cell.column == selectedColumn - 1 &&
        cell.state == selectedCell.state
      ) {
        // Eight case => Leftmost, middle position
        possibleCandidates[7] = cell;
      } else {
        // do nothing
      }
    });
    for (var i = 0; i < allDirections.length; i++) {
      if (possibleCandidates[allDirections[i][0]].row != -1 || possibleCandidates[allDirections[i][1]].row != -1) {
        // If the placeholder of matching candidates is not null => have matche value
        var counter = 1;
        // Begin counter;
        // initialize second matched cell for the winning segment
        var nextCell = possibleCandidates[allDirections[i][0]];
        var nextCellPlus = possibleCandidates[allDirections[i][1]];

        while (nextCell != null && nextCell.state == selectedCell.state) {
          counter = counter + 1;
          nextCell = this.nextCellMatchResult(nextCell, allDirections[i][0], otherCells);
        }

        while (
          nextCellPlus != null &&
          nextCellPlus.state == selectedCell.state
        ) {
          counter = counter + 1;
          nextCellPlus = this.nextCellMatchResult(nextCellPlus, allDirections[i][1], otherCells);
        }

        if (counter >= this.WIN_CONDITION) {
          // Counter reaches requires limit and nextcell.state is not belong to opponent
          //  console.log("VICTORY FOR YOU!!!!")
          return true;
        }
      }
    }
    return false;
  }

  nextCellMatchResult(selectedCell: CellComponent, direction: number, otherCells: CellComponent[]): CellComponent {
    var OpponentCell: CellComponent[];
    if (selectedCell.state == Player.PLAYER_ONE) {
      OpponentCell = this.SecondPlayerCells;
    }

    if (selectedCell.state == Player.PLAYER_TWO) {
      OpponentCell = this.FirstPlayerCells;
    }
    var nextCell: CellComponent = new CellComponent(-1, -1);

    switch (direction) {
      // direction one
      case 0: {
        // first case
        nextCell.row = selectedCell.row - 1;
        nextCell.column = selectedCell.column - 1;
        break;
      }
      case 1: {
        // Second case
        nextCell.row = selectedCell.row - 1;
        nextCell.column = selectedCell.column;
        break;
      }
      case 2: {
        // Third case
        nextCell.row = selectedCell.row - 1;
        nextCell.column = selectedCell.column + 1;
        break;
      }
      case 3: {
        // Forth case
        nextCell.row = selectedCell.row;
        nextCell.column = selectedCell.column + 1;
        break;
      }
      case 4: {
        // Fifth case
        nextCell.row = selectedCell.row + 1;
        nextCell.column = selectedCell.column + 1;
        break;
      }
      case 5: {
        // Second case
        nextCell.row = selectedCell.row + 1;
        nextCell.column = selectedCell.column;
        break;
      }
      case 6: {
        // Second case
        nextCell.row = selectedCell.row + 1;
        nextCell.column = selectedCell.column - 1;
        break;
      }
      case 7: {
        // Second case
        nextCell.row = selectedCell.row;
        nextCell.column = selectedCell.column - 1;
        break;
      }
    }

    OpponentCell.forEach((cell) => {
      if (cell.row == nextCell.row && cell.column == nextCell.column) {
        nextCell = cell;
      }
    });

    otherCells.forEach((cell) => {
      if (cell.row == nextCell.row && cell.column == nextCell.column) {
        nextCell = cell;
      }
    });

    if (nextCell.state != 0) {
      return nextCell;
    }
    return null;
  }

  //WORKER LOGIC
  initializeWebWorker() {
    if (typeof Worker !== 'undefined') {
      if (!this.aiWorker) {
        this.aiWorker = new Worker('../../../assets/mtdf(10).worker.js', {
          type: 'module',
        });
      }
    }
  }

  aiWorkerPost(player) {
    this.aiWorker.postMessage([this.Board, player, this.MaximumTimeForMove]);
    this.aiWorker.addEventListener('message',({ data }) => {
        if(data !== 'full'){
          // console.log('best move');
          // console.log(data.bestmove);
          // console.log(`Call to iterative mtdf took ${data.time} seconds.`);
          // console.log('first moves')
          // console.log(data.firstMoves);
          this.selectCell(data.bestmove.i, data.bestmove.j);
        } else {
          this.openDrawDialog();
        }
      }, {once: true});
  }

  //BUTTON FUNCTIONS
  //The buttons should be another component
  idea() {
    this.aiWorker.postMessage([this.Board, 1, this.MaximumTimeForMove]);
    this.aiWorker.addEventListener('message',({ data }) => {
        var cell = document.getElementById(data.bestmove.i + '_' + data.bestmove.j).getElementsByClassName('cell')[0];
        cell.classList.add('idea');
        setTimeout(function () {cell.classList.remove('idea');}, 700);
      },{ once: true });
  }

  restart() {
    this.stack = {};
    this.count = 0;
    this.redoStack = {};
    this.redoCount = 0;
    this.winner = Player.PLAYER_NONE;
    this.onGoing = true;
    this.gameBoard = [];
    this.Board = [];
    this.FirstPlayerCells = [];
    this.SecondPlayerCells = [];
    this.ngOnInit();
  }

  undo() {
    if(this.count > 0){
      this.count--;
      const element = this.stack[this.count];
      delete this.stack[this.count];
      var i = element.i;
      var j = element.j;
      var state = element.state;
      var selectedCell = this.findCorrectCell(i, j);
      this.gameBoard[i][j] = new CellComponent(i, j);
      this.redoStack[this.redoCount] = {i, j, state};
      this.redoCount++;

      if (selectedCell.state == 1) {
        this.FirstPlayerCells.pop();
      } else if (selectedCell.state == -1) {
        this.SecondPlayerCells.pop();
      }
      selectedCell.changeState(Player.PLAYER_NONE);
      this.winner = 0;
      this.onGoing = true;
      this.Board[i][j] = 0;
    }
  }

  push(selectedCell: any) {
    this.stack[this.count] = selectedCell;
    this.count++;
    this.redoStack = {};
    this.redoCount = 0;

  }

  redo(){
    if (this.redoCount > 0){
      this.redoCount--;
      const element = this.redoStack[this.redoCount];
      delete this.redoStack[this.redoCount];
      var i = element.i;
      var j = element.j;
      var state = element.state;
      var selectedCell = this.findCorrectCell(i, j);
      selectedCell.changeState(state);
      this.stack[this.count] = {i, j, state};
      this.count++;

      if (selectedCell.state == 1) {
        this.FirstPlayerCells.push(selectedCell);
        this.Board[i][j] = 1;
      } else if (selectedCell.state == -1) {
        this.SecondPlayerCells.push(selectedCell);
        this.Board[i][j] = -1;
      }
    }
  }

  printAll() {
    console.log('Board');
    console.log(this.Board);
    console.log('gameBoard');
    console.log(this.gameBoard);
    console.log('allCells');
    console.log(this.allCells);
    console.log('playerOneCells');
    console.log(this.FirstPlayerCells);
    console.log('playerTwoCells');
    console.log(this.SecondPlayerCells);
    console.log('onGoing');
    console.log(this.onGoing);
    console.log('winner');
    console.log(this.winner);
  }

  vsAI(){
    if(this.iavsia == true){
      this.iavsia = false;
    } else {
      this.iavsia = true;
      if(this.CurrentPlayer== Player.PLAYER_ONE){
        this.aiWorkerPost(Player.PLAYER_ONE);
      } else {
        this.aiWorkerPost(Player.PLAYER_TWO);
      }
    }
  }

  set15x15(){
    this.tableSize = 15;
    this.ngOnInit();
  }

  set19x19(){
    this.tableSize = 19;
    this.ngOnInit();
  }

  //POPUP FUNCTIONS
  //This should be implemented on a service
  openDialog(info: any){
    this.dialogRef.open(DialogComponent, {
      data:{
        title: info[0],
        secondTitle: info[1],
        message: info[2],
        buttons: info[3],
        actions: info[4],
        textClass: info[5]
      }
    }).afterClosed().subscribe(results => {
      if(typeof results === 'function'){
        results.call(this)
      }
    });
  }

  openYouWinDialog(){
    var info =["You Win!! :)", null, "Wanna play a New Game?", ["New Game", "Stay Here"], [this.restart], "xubio-text-success"]
    this.openDialog(info);
  }

  openYouLooseDialog(){
    var info =["You Loose :(", null, "Wanna play a New Game?", ["New Game", "Stay Here"], [this.restart], "xubio-text-danger"]
    this.openDialog(info);
  }

  openDrawDialog(){
    var info =["Tied!", null, "Wanna play a New Game?", ["New Game", "Stay Here"], [this.restart]]
    this.openDialog(info);
  }

  openInvalidMoveDialog(){
    var info =["Invalid Move", null, "Try with another one", ["Ok", null], [], "xubio-text-warning"]
    this.openDialog(info);
  }
}
