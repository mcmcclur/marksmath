(* ::Package:: *)

(* :Name: JuliaSet` *)
(* :Author: Mark McClure, April 1998 *)
(* :Copyright: Copyright Mark McClure, 1998 *)
(* :Package Version: 1.2 *)
(* :Mathematica Version: 10.0 *)
(* :History: 
  Written in support of an article that appeared in Mathematica in Education and Research.
  Modified to run with V10 May 2016.
*)
(* :Summary:
	Generates images of Julia sets using several
	variants of the inverse iteration algorithm. 
*)

BeginPackage["JuliaSet`"]


JuliaSet::usage = "JuliaSet is a package containing several
implementations of inverse iteration algorithms for the
generation of Julia sets."

Julia::usage = "Julia[formula,var] generates the Julia set of 
the rational function defined by formula, using the modified 
inverse iteration algorithm."
 
JuliaSimple::usage = "JuliaSimple[c,depth] generates 
2^depth points of the Julia set for z^2 + c using a simple 
deterministic algorithm."
 	
JuliaModified::usage = "JuliaModified[c] generates the Julia set 
for z^2 + c using a modified determinstic algorithm."

JuliaStochastic::usage = "JuliaStochastic[c,numpoints] generates 
numpoints points of the Julia set for z^2 + c using a stochastic
algorithm."

Resolution::usage = "Resolution is a positive integer valued 
Option of Julia and JuliaModified which controls the level of 
detail of the generated set."

Bound::usage = "Bound is a positive real valued Option of 
Julia which specifies the maximum absolute vale of points
plotted in the Julia set of a rational function."

OneBias::usage = "OneBias is an Option of JuliaStochastic which 
determines the probability of choosing the positive inverse of 
z^2 + c.  OneBias must be a real number stricly between 0 and 1."
 	
Begin["`Private`"]

(* Set the Options *)

(* For JuliaSimple *)
JuliaSimpleOptions = Join[{AspectRatio -> Automatic, Axes -> False,
		PlotStyle -> {AbsolutePointSize[0.4]}}, Options[ListPlot]];
keywords = Complement[Union[First /@ JuliaSimpleOptions], 
	{DisplayFunction, DefaultFont}];
vals = keywords /.  JuliaSimpleOptions;
special = {DisplayFunction :> $DisplayFunction, DefaultFont :> $DefaultFont};
Options[JuliaSimple] = Union[Apply[Rule,Transpose[{keywords,vals}],{1}],
	special];

(* For JuliaModified *)
Options[JuliaStochastic] = Join[{OneBias -> .5}, Options[JuliaSimple]];
Options[JuliaModified] = Join[{Resolution -> 200}, Options[JuliaSimple]];
Options[Julia]    = Join[{Bound -> 4}, Options[JuliaModified]];


(* The functions *)

(* Error Messages *)
JuliaSet::argu = "`1` called with `2`; `3` expected."
JuliaSet::badNumber = "Number expected at position 1 in `1`."
JuliaSet::badInt = "Positive Integer expected at position 2 in `1`."
JuliaSet::badOpt = "Options expected as optional arguments in `1`."
JuliaSet::optx = "Unknown Option `1`."
Julia::badFormula = "Rational function of degree at least two 
expected at position 1 in `1`."
Julia::noInverses = "Can't find the the inverse functions."
OneBias::outOfRange = "OneBias must be stricly between 0 and 1. Using 0.5."
Resolution::outOfRange = "Resolution must be a positive integer.  
Using 200."
Bound::outOfRange = "Bound must be a positive number.  Using 4."


JuliaSimple[c_, depth_, opts___] := Module[
	{invImage, points, valid = First /@ Options[JuliaSimple]},
	
	Scan[If[!MemberQ[valid, First[#]],
		Message[JuliaSet::optx, ToString[First[#]]]]&,
		Flatten[{opts}]
	];
	
	invImage := 
		( N[{1,-1} Sqrt[#-c]]& /@ # // Flatten ) &;
	points = {Re[#], Im[#]}& /@ Nest[invImage, {1}, depth];
	ListPlot[points, 
		FilterRules[{opts}, Options[ListPlot]], 
		FilterRules[Options[JuliaSimple], Options[ListPlot]]
	]
] /;  
  ( NumberQ[N[c]] || Message[JuliaSet::badNumber, JuliaSimple, c] ) &&
	( (IntegerQ[depth] && depth > 0 ) ||
	 Message[JuliaSet::badInt, JuliaSimple, depth] ) &&
	( And @@ Map[OptionQ, {opts}] ||
	  	Message[JuliaSet::badOpt,JuliaSimple] )

(* Special cases for JuliaSimple *)
JuliaSimple[]   := Message[JuliaSet::argu, "JuliaSimple", 
	"0 arguments", "2 arguments are"]
JuliaSimple[c_] := Message[JuliaSet::argu, "JuliaSimple", 
	"1 argument",  "2 arguments are"]


JuliaModified[c_, opts___] := Module[
	{invImage,reducedInvImage,pointsSoFar,res, 
	valid = First /@ Options[JuliaModified]},

	Scan[If[!MemberQ[valid, First[#]],
		Message[JuliaSet::optx, ToString[First[#]]]]&,
		{opts}
	];

	res = Resolution /. {opts} /. Options[JuliaModified];
	If[!(IntegerQ[res] && res>0),
		{Message[Resolution::outOfRange];
		res = Resolution /. Options[JuliaModified]}];
	
	invImage := 
		( N[{1,-1} Floor[res Sqrt[#-c]]/res]&  /@ # // Flatten )&;
	reducedInvImage[points_] := Module[{newPoints},
		newPoints = Complement[invImage[points], pointsSoFar];
		pointsSoFar = Union[newPoints, pointsSoFar];
		newPoints];
		
	pointsSoFar = Nest[invImage, {1}, 5];
	FixedPoint[reducedInvImage, pointsSoFar];
	ListPlot[{Re[#], Im[#]}& /@ pointsSoFar, 
		FilterRules[{opts}, Options[ListPlot]], 
		FilterRules[Options[JuliaModified],Options[ListPlot]]
	]
] /;  
	(NumberQ[c] || Message[JuliaSet::badNumber, JuliaModified, c]) &&
    ( And @@ Map[OptionQ, {opts}] ||
	  	Message[JuliaSet::badOpt,JuliaModified] )

(* Special case for JuliaModified *)
JuliaModified[] := Message[JuliaSet::argu, "JuliaModified", 
	"0 arguments", "1 argument is"]
	
	

Julia[formula_, var_Symbol, opts___] := Module[
	{z0,inverses,inverseRules,funcs,image,
	reducedImage,pointsSoFar, res,bound,
	valid = First /@ Options[Julia]},

	Scan[If[!MemberQ[valid, First[#]],
		Message[JuliaSet::optx, ToString[First[#]]]]&,
		{opts}
	];

	res = Resolution /. {opts} /. Options[Julia];
	If[!(IntegerQ[res] && res>0),
		{Message[Resolution::outOfRange];
		res = Resolution /. Options[Julia]}];
	bound = Bound /. {opts} /. Options[Julia];
	If[!(bound>0),
		{Message[Bound::outOfRange];
		bound = Bound /. Options[Julia]}];
	
	inverseRules = NSolve[#==formula,var];
	If[And @@ ListQ /@ inverseRules, If[Length[inverseRules] > 1,
	
		inverses = var /. inverseRules;
		funcs = Function[anInverse,N[Floor[anInverse res]/res] &] 
			/@ inverses;
		image = Flatten[Through[funcs[#]]& /@ #,1]&;
		If[PolynomialQ[formula,var],
			reducedImage[points_] := Module[{newPoints},
				newPoints = Complement[image[points], pointsSoFar];
				pointsSoFar = Union[newPoints, pointsSoFar];
				newPoints],
			reducedImage[points_] := Module[{newPoints},
				newPoints = Complement[image[points], pointsSoFar];
				newPoints = Select[newPoints,(N[Abs[#]]<=bound)&];
				pointsSoFar = Union[newPoints, pointsSoFar];
				newPoints]
		];
		z0 = N[Nest[funcs[[1]][funcs[[2]][#]]&, N[Pi],10]];
		pointsSoFar = Select[Nest[image,{z0},3],(N[Abs[#]]<=bound)&];
		FixedPoint[reducedImage, pointsSoFar];
		ListPlot[{Re[#],Im[#]}& /@ pointsSoFar, 
			FilterRules[{opts}, Options[ListPlot]], 
			FilterRules[Options[Julia],Options[ListPlot]]
		],
	Message[Julia::badFormula, Julia]], Message[Julia::noInverses] 
	]
] (*/; (NumberQ[N[formula /. var -> Pi]]                &&
	PolynomialQ[Numerator[Together[formula]], var]    &&
	PolynomialQ[Denominator[Together[formula]], var]) || 
	Message[Julia::badFormula, Julia]*)

(* Special cases for Julia *)
Julia[]   := Message[JuliaSet::argu, "Julia", 
	"0 arguments", "2 arguments are"]
Julia[c_] := Message[JuliaSet::argu, "Julia", 
	"1 argument",  "2 arguments are"]



JuliaStochastic[c_, numpoints_, opts___] := Module[
	{inv1,inv2,points,z0,oneBias,chooser, 
	valid = First /@ Options[JuliaStochastic]},
	
	Scan[If[!MemberQ[valid, First[#]],
		Message[JuliaSet::optx, ToString[First[#]]]]&,
		{opts}
	];

	oneBias = OneBias /. {opts} /. Options[JuliaStochastic];
	If[!(0<oneBias && oneBias<1),
		{Message[OneBias::outOfRange];
		oneBias = OneBias /. Options[JuliaStochastic]}];
	
	inv1 = N[Sqrt[#-c]]&; inv2 = N[-Sqrt[#-c]]&;
	z0 = Nest[inv1[inv2[#]]&, 1, 5];
	points = ComposeList[Table[chooser = Random[];
		If[chooser<oneBias, inv1, inv2], 
		{numpoints}], z0];
	ListPlot[{Re[#],Im[#]}& /@ points,  
		FilterRules[{opts}, Options[ListPlot]], 
		FilterRules[Options[JuliaStochastic],Options[ListPlot]]
	]
] /;  
	( NumberQ[c] || Message[JuliaSet::badNumber, JuliaStochastic, c] ) &&
	  ( (IntegerQ[numpoints] && numpoints > 0 ) ||
	  	Message[JuliaSet::badInt, JuliaStochastic, numpoints] ) &&
	  ( And @@ Map[OptionQ, {opts}] ||
	  	Message[JuliaSet::badOpt,JuliaStochastic] )
	  	
(* Special cases for JuliaStochastic *)
JuliaStochastic[]   := Message[JuliaSet::argu, "JuliaStochastic", 
	"0 arguments", "2 arguments are"]
JuliaStochastic[c_] := Message[JuliaSet::argu, "JuliaStochastic", 
	"1 argument",  "2 arguments are"]

      
End[]  (* End Private Context *)

Protect[JuliaSet, Julia, JuliaModified, JuliaSimple, 
	JuliaStochastic, Bound, Resolution, OneBias]

EndPackage[]
