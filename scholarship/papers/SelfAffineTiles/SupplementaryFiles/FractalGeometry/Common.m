(* :Name: FractalGeometry`Common` *)
(* :Author: Mark McClure, March 2002 *)
(* :Copyright: Copyright Mark McClure, 2002 *)
(* :Package Version: 1.0 *)
(* :Mathematica Version: 4.1 *)
(* :Summary:
	This package declares a few symbols common to
	the FractalGeometry packages. 
*)

BeginPackage["FractalGeometry`Common`",
	"Graphics`Colors`"]

RotationMatrix::usage = "RotationMatrix[t_] returns a two dimensional
matrix representing a rotaion through angle t about the origin."

Color::usage = "Color is an option to ShowIFSStochastic,
ShowDigrpahFractalsStochastic, and ShowTile. 
Setting Color -> True colors each point according to which function 
from the IFS generated that point.  This distinguishes the 
constituent parts of the set."

Colors::usage = "Colors is an option to ShowIFSStochastic,
ShowDigrpahFractalsStochastic, and ShowTile which specifies
what colors to use when coloring the set.  Colors may be
a list of colors or Colors may be set to Automatic to use
the Hue function."
 

Begin["`Private`"]

RotationMatrix[t_] := {{Cos[t],-Sin[t]},{Sin[t],Cos[t]}};

End[]

Protect[RotationMatrix, Color]

EndPackage[]
