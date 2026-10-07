# Iteration 2 Prompt Archive

> Feedback (iteration 1/QA):
> the enemy positions are chained to the player, they have their movement and on top the movement of the player this is wrong and shows an error in world parenting.
>
> issue 1:
> the player ship is huge, set the camera arm further apart, consider a dynamic scale of 15 ship model sizes for the screen, currently its 2.7 or something
>
> issue 2:
> the player ship and the gun / bullets are not properly aligned/parented, they fire and look at different positions
>
> issue 3: 
> hitboxes make no sense to me, damage is invisible and hits appears random
>
> issue 4: 
> do a sound pass with simple midi effects for fire hit damage
>
> REASONING: Are we properly using the 3 Dimensions in code for movement/hit/fire/asset load?

> I will do the checks directly by playing, you only do code and unit testing (liminal, at that)

> I believe the gameplay you have built is more akin to asteroid than space attack (atari space invaders bootleg title)
>
> I propose we dont waste this effort and split a game mode in the start screen, allowing players to play legacy mode (you will reuse all to create this gamemode after iterations on core mode are complete), this current mode is now codenamed asteroid mode
>
> Show me current pass complete when done
