import {
  Component,
  OnInit,
  ViewChildren,
  QueryList
} from '@angular/core';

import {
  CellComponent
} from '../cell/cell.component';
import {
  Player
} from '../../player_enum';



@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.sass'],
  providers: [

    {
      provide: 'row',
      useValue: 'row'
    },
    {
      provide: 'column',
      useValue: 'column'
    }
  ]
})
export class DashboardComponent implements OnInit {
  // The worker that im gonna use to interact with the AI
  public aiWorker: any;
  private WIN_CONDITION: number = 5;
  public winner: Player = Player.PLAYER_NONE;
  private FirstPlayerCells: CellComponent[] = [];
  private SecondPlayerCells: CellComponent[] = [];
  public lastPlayer: Player;
  public CurrentPlayer: Player;
  public gameBoard;
  public Board = [];
  //Undo variables
  private stack = {};
  private count = 0;
  // GameProgress:
  public onGoing: boolean = true;
  // ViewChild to query Cell
  @ViewChildren(CellComponent) allCells: QueryList < CellComponent > ;

  constructor() {}

  ngOnInit(): void {

    this.gameBoard = this.newGameState();
    this.CurrentPlayer = Player.PLAYER_ONE;
    this.initializeWebWorker();
  }

  initializeWebWorker() {
    if (typeof Worker !== 'undefined') {
      if (!this.aiWorker) {
        this.aiWorker = new Worker('../../../assets/mtdf(10).worker.js', {
          type: "module"
        })
      }
    }
  }

  aiWorkerPost() {
    var MaximumTimeForMove = 100;
    this.aiWorker.postMessage([this.Board, -1, MaximumTimeForMove]);
    this.aiWorker.addEventListener('message', ({
      data
    }) => {
      this.selectCell(data.bestmove.i, data.bestmove.j);
    });
  }

  newGameState(): any {
    // Making up a 15x15 dashboard where each cell is a CellComponent
    var size = 15;
    let newGameState: CellComponent[][] = [];
    for (var i: number = 0; i < size; i++) {
      newGameState[i] = [];
      this.Board[i] = [];
      for (var j: number = 0; j < size; j++) {
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
    // Make the decision

    // Si es el turno de player 1 setea que la casilla es de player1 (x)
    if (this.CurrentPlayer !== Player.PLAYER_NONE && this.gameBoard[i][j].state == 0) {
      this.gameBoard[i][j].state = this.CurrentPlayer;
      this.Board[i][j] = this.CurrentPlayer;
      selectedCell.changeState(this.CurrentPlayer);
      this.push({
        i,
        j
      });

      // assert winner
      let newCell: CellComponent = new CellComponent(i, j);
      newCell.state = this.CurrentPlayer;
      this.winner = this.addCell(newCell);

      // Swap Player's turn
      this.swapPlayers();

      if (this.CurrentPlayer == Player.PLAYER_TWO) {
        this.aiWorkerPost();
      }
    } else {
      // Nothing happend
      //console.log("INVALID MOVE");
      // show a cartelito :v
    }

    if (this.winner == 0) {
      // nothing happend
    } else if (this.winner == 1) {
      // First Player Victory
      this.onGoing = false;
      // Mostrar Popup de Player1 Victory
    } else if (this.winner == -1) {
      this.onGoing = false;
      // Mostrar Popup de Perdiste o algo asi
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

      // console.log("Player 2 just make move " + cell.row + ";" + cell.column + " Win?: " + winYet);

      if (winYet == true) {
        return -1;
      }

    } else {
      //do nothing
      return 0;

    }
  }


  findWinningSegment(selectedCell: CellComponent, otherCells: CellComponent[]): boolean {
    // Cells that maybe are part of the solution
    var possibleCandidates: [CellComponent, CellComponent, CellComponent, CellComponent,
      CellComponent, CellComponent, CellComponent, CellComponent
    ];
    possibleCandidates = [new CellComponent(-1, -1), new CellComponent(-1, -1),
      new CellComponent(-1, -1), new CellComponent(-1, -1),
      new CellComponent(-1, -1), new CellComponent(-1, -1),
      new CellComponent(-1, -1), new CellComponent(-1, -1)
    ]

    // defining same directions, diagonal, vertical, diagonal, horizontal
    var allDirections = [
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7]
    ];

    var selectedRow = selectedCell.row;
    var selectedColumn = selectedCell.column;

    //Finding cell for 1 position:
    otherCells.forEach((cell) => {
      if (cell.row == selectedRow - 1 &&
        cell.column == selectedColumn - 1 &&
        cell.state == selectedCell.state) {
        // First case => First position (Leftmost-top position)
        possibleCandidates[0] = cell;
      } else if (cell.row == selectedRow - 1 &&
        cell.column == selectedColumn &&
        cell.state == selectedCell.state) {
        // Second case => Second position (Middle-top position)
        possibleCandidates[1] = cell;
      } else if (cell.row == selectedRow - 1 &&
        cell.column == selectedColumn + 1 &&
        cell.state == selectedCell.state) {
        // Third case => Second position (Rightmost-top position)
        possibleCandidates[2] = cell;
      } else if (cell.row == selectedRow &&
        cell.column == selectedColumn + 1 &&
        cell.state == selectedCell.state) {
        // Forth case => Rightmost-middle position)
        possibleCandidates[3] = cell;
      } else if (cell.row == selectedRow + 1 &&
        cell.column == selectedColumn + 1 &&
        cell.state == selectedCell.state) {
        // Fifth case => Rightmost-low position)
        possibleCandidates[4] = cell;
      } else if (cell.row == selectedRow + 1 &&
        cell.column == selectedColumn &&
        cell.state == selectedCell.state) {
        // Sixthe case => Middle, low position
        // console.log("Somehing wrong...");
        possibleCandidates[5] = cell;
      } else if (cell.row == selectedRow + 1 &&
        cell.column == selectedColumn - 1 &&
        cell.state == selectedCell.state) {
        // Seven case => Leftmost, low position
        possibleCandidates[6] = cell;
      } else if (cell.row == selectedRow &&
        cell.column == selectedColumn - 1 &&
        cell.state == selectedCell.state) {
        // Eight case => Leftmost, middle position
        possibleCandidates[7] = cell;
      } else {
        // do nothing

      }
    })

    for (var i = 0; i < allDirections.length; i++) {

      if (possibleCandidates[allDirections[i][0]].row != -1 || possibleCandidates[allDirections[i][1]].row != -1) {
        // If the placeholder of matching candidates is not null => have matche value
        var counter = 1;
        // Begin counter;
        // initialize second matched cell for the winning segment
        var nextCell = possibleCandidates[allDirections[i][0]];
        var nextCellPlus = possibleCandidates[allDirections[i][1]]

        while (nextCell != null && nextCell.state == selectedCell.state) {
          counter = counter + 1;
          nextCell = this.nextCellMatchResult(nextCell, allDirections[i][0], otherCells);
        };

        while (nextCellPlus != null && nextCellPlus.state == selectedCell.state) {
          counter = counter + 1;
          nextCellPlus = this.nextCellMatchResult(nextCellPlus, allDirections[i][1], otherCells);
        };

        if (counter >= this.WIN_CONDITION) {
          // Counter reaches requires limit and nextcell.state is not belong to opponent
          //  console.log("VICTORY FOR YOU!!!!")
          return true
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
      case (0): {
        // first case
        nextCell.row = selectedCell.row - 1;
        nextCell.column = selectedCell.column - 1;
        break;
      }
      case (1): {
        // Second case
        nextCell.row = selectedCell.row - 1;
        nextCell.column = selectedCell.column;
        break;
      }
      case (2): {
        // Third case
        nextCell.row = selectedCell.row - 1;
        nextCell.column = selectedCell.column + 1;
        break;
      }
      case (3): {
        // Forth case
        nextCell.row = selectedCell.row;
        nextCell.column = selectedCell.column + 1;
        break;
      }
      case (4): {
        // Fifth case
        nextCell.row = selectedCell.row + 1;
        nextCell.column = selectedCell.column + 1;
        break;
      }
      case (5): {
        // Second case
        nextCell.row = selectedCell.row + 1;
        nextCell.column = selectedCell.column;
        break;
      }
      case (6): {
        // Second case
        nextCell.row = selectedCell.row + 1;
        nextCell.column = selectedCell.column - 1;
        break;
      }
      case (7): {
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
    })

    otherCells.forEach((cell) => {
      if (cell.row == nextCell.row && cell.column == nextCell.column) {
        nextCell = cell;
      }
    })
    if (nextCell.state != 0) {
      return nextCell
    }
    return null;
  }


   // esto deberia ir en un servicio o algo

  restart() {
    this.stack = {};
    this.count = 0;
    this.winner = Player.PLAYER_NONE;
    this.onGoing = true;
    this.gameBoard = [];
    this.Board = [];
    this.FirstPlayerCells = [];
    this.SecondPlayerCells = [];
    this.ngOnInit();
  }

  undo() {
      this.count--;
      const element = this.stack[this.count];
      delete this.stack[this.count];
      var i = element.i;
      var j = element.j;
      var selectedCell = this.findCorrectCell(i, j);
      this.gameBoard[i][j] = new CellComponent(i, j);

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

  push(selectedCell: any) {
    this.stack[this.count] = selectedCell;
    this.count++;
  }

  printAll() {
    console.log("Board")
    console.log(this.Board)
    console.log("gameBoard")
    console.log(this.gameBoard)
    console.log("allCells")
    console.log(this.allCells)
    console.log("playerOneCells")
    console.log(this.FirstPlayerCells)
    console.log("playerTwoCells")
    console.log(this.SecondPlayerCells)
    console.log("onGoing")
    console.log(this.onGoing)
    console.log("winner")
    console.log(this.winner)
  }


}
