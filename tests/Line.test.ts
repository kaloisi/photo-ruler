import { describe, it, expect } from 'vitest';
import Line from '../src/Line';
import Point from '../src/Point';

// Example test for Line class

describe('Line', () => {
  it('test line intersection', () => {
    const topLeft = new Point(0, 0);
    const topRight = new Point(100, 0);
    const bottomLeft = new Point(0, 100);
    const bottomRight = new Point(100, 100);
    
    const line = new Line(topLeft, bottomRight);
    const line2 = new Line(topRight, bottomLeft);
    
    const intersection = line.getIntersection(line2)
    expect(intersection).toEqual(new Point(50, 50));
  });

  it('test split', () => {
    const topLeft = new Point(0, 0);
    const topRight = new Point(100, 0);
    const bottomLeft = new Point(0, 100);
    const bottomRight = new Point(100, 100);
    
    const line = new Line(topLeft, bottomRight);
    const line2 = new Line(topRight, bottomLeft);

    const split = line.split([line2])
    console.log("Split result:", split);
    expect(split.length).toBe(2);
    expect(split).toEqual(
            [new Line(topLeft, new Point(50, 50)),
            new Line(new Point(50, 50), bottomRight)]);
  });
});
