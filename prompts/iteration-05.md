# Iteration 5 Prompt Archive

> Consider the core engine complete.
>
> we will work on the modes, we have two modes, one is engine complete (asteroid), we now need to create the legacy mode for proper space inveders.
>
> roadmap
>
> - L0: learn the space invaders legacy rules: enemies zig zag donwards towards a player that can only move on the left right dimension on the ground, firing up. Zone of the enemies fire slow rounds at sparse intervals. The terrain has floating blockers that get damaged both ways in cross fire, stopping rounds
>
> - L1: do an architectural plan: two game modes on the same engine, look for code dependencies in the asteroid mode that would need to be moved out or elsewhere so as to make the game modes fully modular
>
> - L2: Stub the new legacy game mode and implement
>
> - L3: Hand over to test
>
> For simplicity current advanced assets (ship that can fire enemies that move) can be re used then reworked in the new game mode, either override or clone, whatever is simpler.
