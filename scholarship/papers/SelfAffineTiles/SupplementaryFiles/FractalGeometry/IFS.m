(* :Name: IFS` *)
(* :Author: Mark McClure, Feb 2002 *)
(* :Copyright: Copyright Mark McClure, 2002 *)
(* :Package Version: 1.0 *)
(* :Mathematica Version: 4.0 *)
(* :Summary:
	Generates images of self affine sets. 
*)

BeginPackage["FractalGeometry`IFS`",
	"Utilities`FilterOptions`",
	"FractalGeometry`Common`"]

IFS::usage = "IFS is a package defining several functions used to generate 
images of self-affine sets."

ShowIFS::usage = "ShowIFS[IFS_,depth_] generates the approximation to the 
self similar sets defined by IFS to order depth using a deterministic 
algorithm.  The IFS is represented by a list of affine functions written in 
the form {{{a1,a2},{b1,b2}},{x0,y0}}."

ShowIFSStochastic::usage = "ShowIFSStochastic[IFS_,numPoints_] generates 
numPoints points approximating the self similar sets defined by IFS using a 
stochastic algorithm.  The IFS is represented by a list of affine functions 
written in the form {{{a1,a2},{b1,b2}},{x0,y0}}."

ComputeProbabilities::usage = "ComputeProbabilities[IFS_] estimates a 
probability list for IFS which generates a uniform distribution
of points over the self-affine set determined by IFS."

ComputeIFSDimension::usage = "ComputeDimension[IFS_] computes a numerical 
estimate of the dimension of the corresponding self-affine set."

Initiator::usage = "Initiator is an option for ShowIFS
indicating an initial list of Graphics primitives for the IFS
to operate on."

Probabilities::usage = "Probabilities is an option for ShowIFSStochastic 
indicating a list of probabilities for the functions in the IFS. In 
ShowIFSStochastic[IFS_, numPoints_, 
Probabilities->probabilities], probabilities should be a list of positive 
numbers whose sum is one."

SierpinskiPedalTriangleIFS::usage = "SierpinskiPedalTriangleIFS[{A_,B_,C_}]
returns an IFS to generate the Sierpinski pedal triangle with vertices 
A, B, and C."

Grays::usage = ""

Begin["`Private`"]

(* Set the Options *)

(* For ShowIFS *)
ShowIFSOptions = Join[{AspectRatio -> Automatic,
		Initiator -> Point[{0,0}], Prolog -> {AbsolutePointSize[0.4]},
		Color -> False, Colors -> Automatic},
		Options[Graphics]];
keywords = Complement[Union[First /@ ShowIFSOptions], 
	{DisplayFunction, DefaultFont}];
vals = keywords /.  ShowIFSOptions;
special = {DisplayFunction :> $DisplayFunction, DefaultFont :> $DefaultFont};
Options[ShowIFS] = 
	Union[Apply[Rule,Transpose[{keywords,vals}],{1}], special];

(* For ShowIFSStochastic *)
ShowIFSStochasticOptions = Join[{AspectRatio -> Automatic, Axes -> False,
	Color -> False, Colors -> Automatic,
	Probabilities -> Automatic, Prolog -> {AbsolutePointSize[0.4]}}, 
	Options[Graphics]];
keywords = Complement[Union[First /@ ShowIFSStochasticOptions], 
	{DisplayFunction, DefaultFont}];
vals = keywords /.  ShowIFSStochasticOptions;
special = {DisplayFunction :> $DisplayFunction, DefaultFont :> $DefaultFont};
Options[ShowIFSStochastic] = 
	Union[Apply[Rule,Transpose[{keywords,vals}],{1}], special];

(* The Functions *)

(* Error Messages *)
IFS::optx = "Unknown Option `1`."
IFS::badIFS = "The first argument in `1` must be a
list of affine lists."
IFS::badInt = "The second argument in `1` must be a
non-negative integer."
IFS::badOpt = "Options expected as optional arguments in `1`."


ShowIFS[IFS_,depth_,opts___] :=	Module[
	{toFunc, fOut, funcs, attractor, color, colors},
	initiator = Initiator /. {opts} /. Options[ShowIFS];
	color = Color  /. {opts} /. Options[ShowIFS];
	colors = Colors  /. {opts} /. Options[ShowIFS];
	If[colors ===  Automatic, 
		colors =  Hue[#,.7,.7]& /@ Range[0.,1 - 1./Length[IFS], 1./Length[IFS]]];
	If[colors ==  Grays, 
		colors =  GrayLevel /@ Range[0.,1 - 1./Length[IFS], 1./Length[IFS]]];
	toFunc[{A_,b_}] :=Module[{cfOut, fOut},
		fOut[{x_,y_}]:=N[A.{x,y}+b]/;NumericQ[x]&&NumericQ[y];
		cfOut = Compile[{{v,_Real,1}},
			A.v + b];
		fOut[Point[{x_,y_}]]:=Point[cfOut[{x,y}]];
		fOut[x_List]:=fOut/@x;
		fOut[Line[x__]]:=Line[cfOut/@x];
		fOut[Polygon[x__]]:=Polygon[cfOut/@x];
		fOut[Disk[p_,r_]]:=Disk[cfOut[p],r];
		fOut[Circle[p_,r_]]:=Circle[cfOut[p],r];
		fOut[init[x__]] := init[fOut[x]];
		fOut[h_[x__]]:=h[x];
		fOut
	];
	funcs = toFunc /@ IFS;
	attractor = Nest[Through[funcs[#]]&,init@initiator,depth];
	If[color === True, 
	coloredAttractor = Partition[Flatten[attractor], Length[IFS]^(depth -  1)];
	coloredAttractor = Inner[List, colors, coloredAttractor, List];
	coloredAttractor = coloredAttractor /. init[x__] -> x;,
	coloredAttractor = attractor /. init[x__] -> x;];
	Show[Graphics[coloredAttractor],
		FilterOptions[Graphics,opts],
		FilterOptions[Graphics,Sequence @@ Options[ShowIFS]]] 
] /;
	(And @@	Flatten[Map[MatchQ[#,
		{{{a_?NumericQ,	b_?NumericQ}, {c_?NumericQ,	d_?NumericQ}},
		{e_?NumericQ, f_?NumericQ}}] &,	IFS]] ||
		Message[IFS::badIFS, ShowIFS] )	 &&
	( (IntegerQ[depth] && depth	>= 0 ) ||
		Message[IFS::badInt, ShowIFS, depth] ) &&
	( And @@ Map[OptionQ, {opts}] ||
	  	Message[IFS::badOpt,ShowIFS] )
	  	
	  	

ShowIFSStochastic[IFS_, n_, opts___] := Module[
	{ funcs, toFunc, points, chooser, randomSequence,
		color, colors, coloredPoints,
        pList, pSums, twoNorms, approximateDim },
        
	(* toFunc[{A_,b_}] := N[A.# + b]&; *)
	toFunc[{A_,b_}] := Compile[{{v,_Real,1}},
		A.v + b];
	funcs = toFunc /@ IFS;

	color = Color /. {opts} /. Options[ShowIFSStochastic];
	colors = Colors /. {opts} /. Options[ShowIFSStochastic];
	pList = Probabilities /. {opts} /. Options[ShowIFSStochastic];
	If[pList == Automatic,
		twoNorms = N[Sqrt[Max[Eigenvalues[#.Transpose[#]]]]]& /@
			( First /@ IFS );
		approximateDim = d /. 
			FindRoot[Plus @@ (#^d & /@ twoNorms) == 1, {d,1}];
		pList = #^approximateDim & /@ twoNorms
	];
	
	pSums = FoldList[Plus, 0, N[pList]];
	randomSequence = Table[chooser = Random[];
		Length[Select[ pSums, (# < chooser)& ]], {n}];
	points = Point /@ Drop[ComposeList[Table[
		funcs[[ randomSequence[[i]] ]], 
		{i,1,n}], {0,0}],1];
	If[color === True, 
		If[colors === Automatic, 
			pointColors = Hue[#,.7,.7]& /@ (randomSequence / (Length[IFS])),
			pointColors = colors[[randomSequence]]];
		coloredPoints = Inner[List, pointColors, points, List];
		Show[Graphics[coloredPoints],
			FilterOptions[ListPlot,opts], 
				FilterOptions[ListPlot,Sequence @@ Options[ShowIFSStochastic]]],
		Show[Graphics[points],
			FilterOptions[ListPlot,opts], 
				FilterOptions[ListPlot,Sequence @@ Options[ShowIFSStochastic]]]]
] /;
	(And @@ Flatten[Map[MatchQ[#,
		{{{a_?NumericQ, b_?NumericQ}, {c_?NumericQ, d_?NumericQ}},
		{e_?NumericQ, f_?NumericQ}}] &, IFS]] ||
		Message[IFS::badIFS, ShowIFSStochastic] )  &&
	( (IntegerQ[n] && n >= 0 ) ||
		Message[IFS::badInt, ShowIFSStochastic, n] ) &&
	( And @@ Map[OptionQ, {opts}] ||
	  	Message[IFS::badOpt,ShowIFSStochastic] )


ComputeIFSDimension[IFS_] := Module[{twoNorms},
	twoNorms = N[Sqrt[Max[Eigenvalues[#.Transpose[#]]]]]& /@
		( First /@ IFS );
	d /. FindRoot[Plus @@ (#^d & /@ twoNorms) == 1, {d,1}]
] /;
	(And @@ Flatten[Map[MatchQ[#,
		{{{a_?NumericQ, b_?NumericQ}, {c_?NumericQ, d_?NumericQ}},
		{e_?NumericQ, f_?NumericQ}}] &, IFS]] ||
		Message[IFS::badIFS, 
			ComputeDimension] )


ComputeProbabilities[IFS_] := Module[{twoNorms,approximateDim},
	twoNorms = N[Sqrt[Max[Eigenvalues[#.Transpose[#]]]]]& /@
		( First /@ IFS );
	approximateDim = d /. 
		FindRoot[Plus @@ (#^d & /@ twoNorms) == 1, {d,1}];
	#^approximateDim & /@ twoNorms
] /;
	(And @@ Flatten[Map[MatchQ[#,
		{{{a_?NumericQ, b_?NumericQ}, {c_?NumericQ, d_?NumericQ}},
		{e_?NumericQ, f_?NumericQ}}] &, IFS]] ||
		Message[IFS::badIFS, 
			ComputeProbabilities] )
			
SierpinskiPedalTriangleIFS[{A_,B_,C_}] := Module[
	{A1 = C + ((B-C).(A-C))/((B-C).(B-C)) (B-C),
	B1 = C + ((A-C).(B-C))/((A-C).(A-C)) (A-C),
	C1 =A+ ((B-A).(C-A))/((B-A).(B-A)) (B-A),
	M = {{a,b},{c,d}}, v = {x,y}, eqs}, 

	eqs = {M.A + v == A, M.B + v == B1, M.C + v == C1};
	{fA} = {{{a,b},{c,d}},{x,y}} /. 
		Solve[eqs,{a,b,c,d,x,y}];
	eqs = {M.A + v == A1, M.B + v == B, M.C + v == C1};
	{fB} = {{{a,b},{c,d}},{x,y}} /. 
		Solve[eqs,{a,b,c,d,x,y}];
	eqs = {M.A + v == A1, M.B + v == B1, M.C + v == C};
	{fC} = {{{a,b},{c,d}},{x,y}} /. 
		Solve[eqs,{a,b,c,d,x,y}];
	{fA,fB,fC}
];
      
End[]  (* End Private Context *)

Protect[IFS,ShowIFS, ShowIFSStochastic, 
	ComputeProbabilities, ComputeIFSDimension,
	SierpinskiPedalTriangleIFS, Colors,
	Initiator, Probabilities]

EndPackage[]
