import { useEffect, useMemo, useState } from "react";
import {
  Square,
  XSquareFill,
  Icon1SquareFill,
  Icon2SquareFill,
  Icon3SquareFill,
  Icon4SquareFill,
  Icon5SquareFill,
  Icon6SquareFill,
  Icon7SquareFill,
  Icon8SquareFill,
  Icon9SquareFill,
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
} from "react-bootstrap-icons";

import styles from "@/styles/dice.module.css";
import clsx from "clsx";

interface TileProps {
  value: number;
  closed: boolean;
  selectable: boolean;
  selected: boolean;
  onClick: () => void;
}

function Tile({ value, closed, selectable, selected, onClick }: TileProps) {
  let Component = XSquareFill;
  if (closed) {
    Component = XSquareFill;
  } else {
    switch (value) {
      case 1:
        Component = Icon1SquareFill;
        break;
      case 2:
        Component = Icon2SquareFill;
        break;
      case 3:
        Component = Icon3SquareFill;
        break;
      case 4:
        Component = Icon4SquareFill;
        break;
      case 5:
        Component = Icon5SquareFill;
        break;
      case 6:
        Component = Icon6SquareFill;
        break;
      case 7:
        Component = Icon7SquareFill;
        break;
      case 8:
        Component = Icon8SquareFill;
        break;
      case 9:
        Component = Icon9SquareFill;
        break;
    }
  }

  const classes = clsx(
    {"btn p-0": selectable},
    {"text-body-tertiary": !selectable && !closed},
    {"border border-3 border-primary rounded-4": selected},
    {"text-secondary": closed},
  );

  const iconNode = <Component width="100%" height="auto" className={classes} />;
  if (selectable) {
    return <button className="border-0 bg-transparent p-0" onClick={onClick}>{iconNode}</button>;
  } else {
    return iconNode;
  }
}

function Die({ value }: { value: number | null }) {
  if (value) {
    switch (value) {
      case 1:
        return <Dice1 width="100%" height="auto" />;
      case 2:
        return <Dice2 width="100%" height="auto" />;
      case 3:
        return <Dice3 width="100%" height="auto" />;
      case 4:
        return <Dice4 width="100%" height="auto" />;
      case 5:
        return <Dice5 width="100%" height="auto" />;
      case 6:
        return <Dice6 width="100%" height="auto" />;
    }
  }

  return (
    <div className={clsx('position-relative', styles['rolling-die'])}>
      <Dice1 width="100%" height="auto" className={styles['die-1']} />
      <Dice2 width="100%" height="auto" className={styles['die-2']} />
      <Dice3 width="100%" height="auto" className={styles['die-3']} />
      <Dice4 width="100%" height="auto" className={styles['die-4']} />
      <Dice5 width="100%" height="auto" className={styles['die-5']} />
      <Dice6 width="100%" height="auto" className={styles['die-6']} />
    </div>
  )
}

export default function Shutbox() {
  const tiles = useMemo(() => [1, 2, 3, 4, 5, 6, 7, 8, 9], []);
  const [closed, setClosed] = useState<number[]>([]);
  const [dice, setDice] = useState<[number | null, number | null]>([6, 6]);
  const [hasRolled, setHasRolled] = useState(false);
  const [selectable, setSelectable] = useState<number[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState(false);

  const rolling = dice[0] === null || dice[1] === null;
  const canRoll = !rolling && !hasRolled;

  const canClose = (() => {
    if(!dice[0] || !dice[1]) return false;
    const sum = dice[0] + dice[1];
    const selectedSum = selected.reduce((acc, tile) => acc + tile, 0);
    if (sum !== selectedSum) return false;
    return true;
  })();

  useEffect(() => {
    function updateSelectable() {
      if(!hasRolled) {
        setSelectable([]);
        return;
      }

      if(!dice[0] || !dice[1]) return;
      const sum = dice[0] + dice[1];
      const newSelectable = [];

      const alreadySelected = selected[0] || false;
      if (alreadySelected) {
        newSelectable.push(alreadySelected);
        if (sum !== alreadySelected) {
          const compliment = sum - alreadySelected;
          newSelectable.push(compliment);
        }
      } else {
        for (const tile of tiles) {
          console.log("evaluating tile for sum ", tile, sum);
          if (tile > sum) break;
          if (closed.includes(tile)) continue;
          if (tile === sum) {
            newSelectable.push(tile);
            continue;
          }

          const compliment = sum - tile;
          console.log("compliment", compliment);
          if (tile === compliment) continue;
          if (!tiles.includes(compliment)) continue;
          if (closed.includes(compliment)) continue;

          newSelectable.push(tile);
        }
      }

      setSelectable(newSelectable);
      if (newSelectable.length === 0) setGameOver(true);
    }

    updateSelectable();
  }, [tiles, hasRolled, dice, closed, selected, setSelectable, setGameOver]);

  function rollDice() {
    if (!canRoll) return;

    setDice([null, null]);
    setTimeout(() => {
      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;

      setDice([die1, die2]);
      setHasRolled(true);
    }, 750);
  }

  function toggleTile(tile: number) {
    if (!selectable.includes(tile)) return;
    if (selected.includes(tile)) {
      setSelected(selected.filter((t) => t !== tile));
    } else {
      setSelected([...selected, tile])
    }
  }

  function closeTiles() {
    if (!canClose) return;
    setClosed([...closed, ...selected]);
    setSelected([]);
    setHasRolled(false);
  }

  function resetGame() {
    setClosed([]);
    setDice([6, 6]);
    setHasRolled(false);
    setSelectable([]);
    setSelected([]);
    setGameOver(false);
  }

  const colStyle = clsx("col p-0 p-sm-1");

  return (<>
    <div className="row">
      <div className="col text-center">
        <h2>Shutbox</h2>
      </div>
    </div>

    <div className="row">
      <div className={clsx(colStyle, "d-none d-sm-block")}></div>
      {tiles.map((tile) => (
        <div key={tile} className={clsx(colStyle, "d-flex align-items-center justify-content-center")}>
          <Tile
            value={tile}
            closed={closed.includes(tile)}
            selectable={selectable.includes(tile)}
            selected={selected.includes(tile)}
            onClick={() => toggleTile(tile)}
          />
        </div>
      ))}
      <div className={clsx(colStyle, "d-none d-sm-block")}></div>
    </div>

    <div className="row my-2">
      <div className={clsx(colStyle, "d-none d-sm-block")}></div>
      <div className={clsx(colStyle, "d-none d-sm-block")}></div>
      <div className={colStyle}></div>
      <div className={colStyle}>
        <Square width="100%" height="auto" color="white" />
      </div>
      <div className={colStyle}>
        <Die value={dice[0]} />
      </div>
      <div className={colStyle}>
        <Die value={dice[1]} />
      </div>
      <div className={clsx(colStyle, "col-6 d-flex align-items-center")}>
        {!hasRolled && !gameOver &&
          <button className="btn btn-primary" onClick={rollDice} disabled={!canRoll}>Roll the dice</button>
        }
        {hasRolled && !canClose && !gameOver &&
          <button className="btn btn-secondary">Pick tiles!</button>
        }
        {hasRolled && canClose && !gameOver &&
          <button className="btn btn-danger" onClick={closeTiles}>Close tiles</button>
        }
        {gameOver &&
          <button className="btn btn-success" onClick={resetGame}>New Game</button>
        }
      </div>
    </div>

    <div className="row my-2">
      {gameOver &&
        <div className="col text-center">
          Game Over!
          {closed.length === 9 &&
            <span className="text-success ps-2 fs-2">You shut the box!</span>
          }
          {closed.length < 9 &&
            <span className="text-danger ps-2 fs-2">You lose!</span>
          }
        </div>
      }
    </div>
  </>);
}
