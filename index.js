const crypto = require("crypto");

class HMACCalculator {
  constructor(key) {
    this.key = key;
  }

  calculateHMAC(message) {
    const hmac = crypto.createHmac("sha256", this.key);
    hmac.update(message);
    return hmac.digest("hex");
  }
}

class MoveGenerator {
  constructor(moves) {
    this.moves = moves;
  }
  generateMove() {
    return this.moves[Math.floor(Math.random() * this.moves.length)];
  }
}

class Rules {
  constructor(moves) {
    this.moves = moves;
    this.movesCount = moves.length;
  }

  determineWinner(userMove, computerMove) {
    const userIndex = this.moves.indexOf(userMove);
    const computerIndex = this.moves.indexOf(computerMove);

    if (userIndex === computerIndex) {
      return "DRAW";
    }

    const userWinMoves = [];

    for (let i = 1; i <= this.movesCount / 2; i++) {
      const nextMoveIndex = (userIndex + i) % this.movesCount;
      userWinMoves.push(nextMoveIndex);
    }

    if (userWinMoves.includes(computerIndex)) {
      return "WIN";
    }

    return "LOSE";
  }
}

class RPSGame {
  constructor(moves) {
    this.moves = moves;
    this.key = this.generateKey();
    this.computerMoveGenerator = new MoveGenerator(moves);
    this.hmacCalculator = new HMACCalculator(this.key);
    this.rules = new Rules(moves);
    this.computerMove = this.computerMoveGenerator.generateMove();
    this.hmac = this.hmacCalculator.calculateHMAC(this.computerMove);
  }

  generateKey() {
    return crypto.randomBytes(32).toString("hex");
  }

  playGame(userChoice) {
    const userMove = this.moves[userChoice - 1];
    const result = this.rules.determineWinner(userMove, this.computerMove);

    console.log(`Your move: ${userMove}`);
    console.log(`Computer move: ${this.computerMove}`);

    if (result === "WIN") {
      console.log("\x1b[32m%s\x1b[0m", "You win!");
    } else if (result === "LOSE") {
      console.log("\x1b[31m%s\x1b[0m", "You lose!");
    } else {
      console.log("\x1b[33m%s\x1b[0m", "It's a draw!");
    }

    console.log(`HMAC key: ${this.key}`);
  }

  displayMenu() {
    console.log(`HMAC: ${this.hmac}`);
    console.log("Available moves:");
    this.moves.forEach((move, index) => {
      console.log(`${index + 1} - ${move}`);
    });
    console.log("0 - exit");
    console.log("? - help");
  }
  displayHelp() {
    const movesTable = {};
    for (const move of this.moves) {
      movesTable[move] = {};
      for (const opponentMove of this.moves) {
        const result = this.rules.determineWinner(move, opponentMove);
        movesTable[move][opponentMove] = result;
      }
    }

    console.table(movesTable);
  }
}

function validateMoves(moves) {
  if (moves.length < 3) {
    console.log("Please provide at least 3 moves");
    return false;
  }
  if (moves.length % 2 !== 1) {
    console.log("Please provide an odd number of moves");
    return false;
  }
  const nonUniqueMove = moves.find(
    (move, index) => moves.indexOf(move) !== index
  );

  if (nonUniqueMove) {
    console.error(
      `Please provide unique moves. '${nonUniqueMove}' is used more than once.`
    );
    return false;
  }

  return true;
}

const moves = process.argv.slice(2);

if (validateMoves(moves)) {
  let game = new RPSGame(moves);
  game.displayMenu();

  const rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  function getUserInput() {
    rl.question("Enter your move: ", (userInput) => {
      const userChoice = userInput.trim();

      if (userChoice === "0") {
        console.log("Goodbye!");
        rl.close();
      } else if (userChoice === "?") {
        game.displayHelp();
        rl.question("Press any key to continue...", () => {
          game.displayMenu();
          getUserInput();
        });
      } else if (userChoice >= 1 && userChoice <= moves.length) {
        game.playGame(parseInt(userChoice));
        rl.question("Do you want to play again? (y/n): ", (answer) => {
          if (answer === "y") {
            game = new RPSGame(moves);
            game.displayMenu();
            getUserInput();
          } else {
            console.log("Goodbye!");
            rl.close();
          }
        });
      } else {
        console.log(
          "Invalid input. Please choose a valid move or enter '?' for help."
        );
        getUserInput();
      }
    });
  }

  getUserInput();
}
