legacy mode:

Bug: the haste is like, cube of haste, when it should be haste plus some haste number minus remaining enemies or like that. calcutate that the last enemy's speed cannot be more than thrice the ship's speed.

Both modes: Enemies primer

Legacy: the invaders all have the same speed, ai atrirbutes, but are different shapes.
Asteroid: in the original asteroid the (enemy)rocks would split on inpact, one type plits into other two types, and so on like a binary tree.

Gameplay changes:

LEGACY: look for more alien looking shapes in the assets and generate once a ramdomized grid for the spawns, change the grid by an offset in a closed array of enemy model references to give the enemy grid processor cheap randomness (the offset is the only runtime random)

ASTEROID: use the same random closed loop offset arragement to order the breakdown on impact of enemy ships, Enemies are now three types, A,B,C, a splits into two b splits into two c they spawn in waves according to horde game logic
