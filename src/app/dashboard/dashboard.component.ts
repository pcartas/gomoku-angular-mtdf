import { Component, OnInit, ViewChildren,
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
  // GameProgress:
  public onGoing: boolean = true;
  // ViewChild to query Cell 
  @ViewChildren(CellComponent) allCells: QueryList < CellComponent > ;

  constructor() {
    this.initializeWebWorker();
  }

  ngOnInit(): void {
    // Making up a 15x15 dashboard where each cell is a CellComponent
    this.gameBoard = this.newGameState();
    this.CurrentPlayer = Player.PLAYER_ONE;
  }

  initializeWebWorker(){
    if (typeof Worker !== 'undefined'){
      if (!this.aiWorker){
        this.aiWorker = new Worker('../../assets/mtdf(10).worker.js', {type: "module"})
      }
    }
  }
  
  aiWorkerPost(){
    // this.aiWorker.onmessage = function(e) {
    //   console.log(e.data.bestmove);
    //   console.log(`Cache Hits: ${e.data.CacheHits}`)
    //   console.log(`Cache Cutoffs: ${e.data.CacheCutoffs}`)
    //   console.log(`Cache Puts: ${e.data.CachePuts}`)
    //   console.log(`function calls ${e.data.fc}`)
    //   console.log(`Call to iterative mtdf took ${e.data.time} seconds.`)
    //   console.log(`StateCacheHits: ${e.data.StateCacheHits}`)
    //   console.log(`StateCachePuts: ${e.data.StateCachePuts}`)
    //   console.log(e.data.firstMoves)
    //   }
    var MaximumTimeForMove = 6;
    this.aiWorker.postMessage([this.Board, -1, MaximumTimeForMove]);
    this.aiWorker.addEventListener('message', ({data}) => {
      this.selectCell(data.firstMoves[0].i, data.firstMoves[0].j)
    });
  }

  newGameState(): any {
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
    //console.log("Cell ["+i+","+j+"] has been selected" );
    var selectedCell: CellComponent = this.findCorrectCell(i, j);
    // console.log(selectedCell);
    //console.log(this.CurrentPlayer)
    // Make the decision

    // Si es el turno de player 1 setea que la casilla es de player1 (x)
    if (this.CurrentPlayer !== Player.PLAYER_NONE && this.gameBoard[i][j].state == 0) {
      this.gameBoard[i][j].state = this.CurrentPlayer;
      this.Board[i][j] = this.CurrentPlayer;
      selectedCell.changeState(this.CurrentPlayer);
      // console.log(selectedCell);

      // assert winner
      let newCell: CellComponent = new CellComponent(i, j);
      newCell.state = this.CurrentPlayer;
      this.winner = this.addCell(newCell);

      // Swap Player's turn
      this.swapPlayers();

      if(this.CurrentPlayer == Player.PLAYER_TWO){
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

  swapPlayers(){
    if (this.CurrentPlayer == Player.PLAYER_ONE){
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


  // ngAfterViewInit() {
  //   //this.allCells.toArray().forEach(instance => console.log(instance))    
  // }


  addCell(cell: CellComponent): number {
    if (cell.state == Player.PLAYER_ONE) {
      this.FirstPlayerCells.push(cell);

      // Evaluate
      this.lastPlayer = Player.PLAYER_ONE;
      var winYet = this.findWinningSegment(cell, this.FirstPlayerCells);
      console.log("Player 1 just make move " + cell.row + ";" + cell.column + " Win?: " + winYet);

      if (winYet == true) {
        return 1;
      }
    } else if (cell.state == Player.PLAYER_TWO) {
      this.SecondPlayerCells.push(cell);

      // Evaluate
      this.lastPlayer = Player.PLAYER_TWO;
      var winYet = this.findWinningSegment(cell, this.SecondPlayerCells);

      console.log("Player 2 just make move " + cell.row + ";" + cell.column + " Win?: " + winYet);

      if (winYet == true) {
        return -1;
      }

    } else {
      //do nothing
      return 0;

    }
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
    var allDirections = [
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7]
    ];

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

if (typeof Worker !== 'undefined') {
  // Create a new
  const worker = new Worker('./dashboard.worker', { type: 'module' });
  worker.onmessage = ({ data }) => {
    console.log(`page got message: ${data}`);
  };
  worker.postMessage('hello');
} else {
  // Web Workers are not supported in this environment.
  // You should add a fallback so that your program still executes correctly.
}