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
} from '../Player';

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
  public CurrentPlayer: Player;
  public gameBoard;
  // GameProgress:
  public onGoing: boolean = true;
  // ViewChild to query Cell 
  @ViewChildren(CellComponent) allCells: QueryList < CellComponent > ;

  constructor() {}

  ngOnInit(): void {
    // creando tablero de 15x15 donde cada celda es un CellComponent
    this.gameBoard = () => {
      var size = 15;
      let newGameState: CellComponent[][] = [];
      for (var i: number = 0; i < size; i++) {
        newGameState[i] = [];
        for (var j: number = 0; j < size; j++) {
          newGameState[i][j] = new CellComponent(i, j);
        }
      }
      return newGameState;
    }
  }

  selectCell(i: number, j: number) {
    if (this.onGoing == false) {
      return null;
    }
    //console.log("Cell ["+i+","+j+"] has been selected" );
    var selectedCell: CellComponent = this.findCorrectCell(i, j);
    //    console.log(selectedCell)
    // Make the decision

    // Si es el turno de player 1 setea que la casilla es de player1 (x)
    if (this.CurrentPlayer == Player.PLAYER_ONE && this.gameBoard[i][j].state == 0) {
      this.gameBoard[i][j].state = this.CurrentPlayer;
      selectedCell.changeState(this.CurrentPlayer);

      // assert winner
      let newCell: CellComponent = new CellComponent(i, j);
      newCell.state = this.CurrentPlayer;
      this.winner = this.addCell(newCell);


      // Swap Player's turn
      this.CurrentPlayer = Player.PLAYER_TWO;

    } else if (this.CurrentPlayer == Player.PLAYER_TWO && this.gameBoard[i][j].state == 0) {
      this.gameBoard[i][j].state = this.CurrentPlayer;
      selectedCell.changeState(this.CurrentPlayer);

      // assert winner
      let newCell: CellComponent = new CellComponent(i, j);
      newCell.state = this.CurrentPlayer;
      this.winner = this.addCell(newCell);

      //Swap Player Turn
      this.CurrentPlayer = Player.PLAYER_ONE;


    } else {
      // Nothing happend
      //console.log("INVALID MOVE");

    }

    if (this.winner == 0) {
      // nothing happend
    } else if (this.winner == 1) {
      // First Player Victory
      this.onGoing = false;
      // Mostrar Popup de Player1 Victory
    } else if (this.winner == 2) {
      this.onGoing = false;
      // Mostrar Popup de Perdiste o algo asi 
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


  // ngAfterViewInit() {
  //   //this.allCells.toArray().forEach(instance => console.log(instance))    
  // }


  addCell(cell: CellComponent): number {
    if (cell.state == Player.PLAYER_ONE) {
      this.FirstPlayerCells.push(cell);

      // Evaluate
      this.lastPlayer = Player.PLAYER_ONE;
      var winYet = this.assertPlayerTable(this.FirstPlayerCells);
      console.log("Player 1 just make move " + cell.row + ";" + cell.column + " Win?: " + winYet);

      if (winYet == true) {
        return 1;
      }
    } else if (cell.state == Player.PLAYER_TWO) {
      this.SecondPlayerCells.push(cell);

      // Evaluate
      this.lastPlayer = Player.PLAYER_TWO;
      var winYet = this.assertPlayerTable(this.SecondPlayerCells);

      console.log("Player 2 just make move " + cell.row + ";" + cell.column + " Win?: " + winYet);

      if (winYet == true) {
        return 2;
      }

    } else {
      //do nothing
      return 0;

    }
  }

  // This function take all input of one player's move and evaluate his winning state
  assertPlayerTable(PlayerCells: CellComponent[]): boolean {
    // console.log("All Cell made by player " + PlayerCells[0].state + " is:");
    // console.log(PlayerCells)
    var flag = false;
    PlayerCells.some((cell) => {
      if (this.findWinningSegment(cell, PlayerCells) == true) {
        flag = true;
      }
    })
    //default: return false
    return flag;
  }

  findWinningSegment(selectedCell: CellComponent, otherCells: CellComponent[]): boolean {
    // console.log("Finding Winning Segment for :")
    // console.log(selectedCell);

    // Analyze
    var possibleCandidates: [CellComponent, CellComponent, CellComponent, CellComponent,
      CellComponent, CellComponent, CellComponent, CellComponent
    ];
    possibleCandidates = [new CellComponent(-1, -1), new CellComponent(-1, -1),
      new CellComponent(-1, -1), new CellComponent(-1, -1),
      new CellComponent(-1, -1), new CellComponent(-1, -1),
      new CellComponent(-1, -1), new CellComponent(-1, -1)
    ]

    // These two below number should be fixed
    var selectedRow = selectedCell.row;
    var selectedColumn = selectedCell.column;

    //Finding cell for 1 position:
    otherCells.forEach((cell) => {
      // console.log("Checking cell:");
      // console.log(cell);

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

    for (var i = 0; i < 8; i++) {
      if (possibleCandidates[i].row != -1) {
        // If the placeholder of matching candidates is not null => have matche value
        var counter = 1;
        // Begin counter;
        var direction = i;
        // initialize second matched cell for the winning segment
        var nextCell = possibleCandidates[i];
        // console.log("Possible Candidates: on direction " + i +" From cell of row"
        // 	    + selectedCell.row + " column: " + selectedCell.column);

        // console.log("Counter " + counter + "Current Cell");
        // console.log(nextCell);
        while (nextCell != null && nextCell.state == selectedCell.state) {
          counter = counter + 1;
          nextCell = this.nextCellMatchResult(nextCell, direction, otherCells);

          // console.log("Counter " + counter + "Current Cell");	  
          // console.log(nextCell);
        };

        if (counter >= this.WIN_CONDITION && nextCell == null) {
          // Counter reaches requires limit and nextcell.state is not belong to opponent
          //  console.log("VICTORY FOR YOU!!!!")
          return true
        }
      }
    }
    return false;
  }

  nextCellMatchResult(selectedCell: CellComponent, direction: number, otherCells: CellComponent[]): CellComponent {
    // console.log("Selected Cell:")
    // console.log(selectedCell);

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

    // console.log("Next expected cell in row:");
    // console.log(nextCell);


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
    // return 0 -> next cell is blank; 1 -> next cell is allied call; -1 : next cell is opponent cell
    return null;
  }


}
