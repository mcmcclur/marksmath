(* :Title: Digraph Fractals *)
(* :Context: FractalGeometry`DigraphFractals` *)
(* :Author: Mark McClure *)
(* :Copyright: Copyright 1999, 2003, Mark McClure *)
(* :Package Version: 2.0 *)
(* :Mathematica Version: 4.2 *)
(* :Summary:
	Generates images of digraph self-similar and
	digraph self-affine sets.
*)
(* :Keywords: fractal, self-affine, self-similar, 
	digraph self-affine, digraph self-similar,
	mixed self-affine, mixed self-similar,
	digraph IFS
*)


(* :History: Original version written 1999. 

	Version 2.0 October 2003. 
	Major enhancements include:
	  * Moved to the FractalGeometry` context.
	    Primarily to allow interaction with the
	    SelfAffineTiles package.
	  * Added the Colors option to 
	    ShowDigraphFractalsStochastic.
	  * Added the StronglyConnectedDigraphQ function.
*)


(* :Sources:
	Bandt, C. 1989. "Self-similar sets III. Constructions with
	sofic systems."  Monatsh. Math. 108:89-102.
	
	Mauldin, R.D. and Williams, S.C., 1988.  "Hausdorff dimension 
	in graph directed constructions." Trans. Amer. Math. Soc. 
	309:811-829.
	
	McClure, M. 2000. "Directed-graph iterated function systems."
	Mathematica in Education and Research. 9(2).	
*)


BeginPackage["FractalGeometry`DigraphFractals`",
	"Utilities`FilterOptions`",
	"FractalGeometry`Common`"]

DigraphFractals::usage = "DigraphFractals is a package defining
several functions used to generate images of digraph Self 
Similar sets."

ShowDigraphFractals::usage = "ShowDigraphFractals[digraph_,depth_]
generates the approximation to the digraph self similar sets 
defined by digraph to order depth using a deterministic algorithm.
The digraph is represented by a matrix of lists of affine functions
written in the form {{{a1,a2},{b1,b2}},{x0,y0}}."

ShowDigraphFractalsStochastic::usage = 
"ShowDigraphFractalsStochastic[digraph_,numPoints_]
generates numPoints points approximating the digraph Self Similar
sets defined by digraph using a stochastic algorithm.
The digraph is represented by a matrix of lists of affine functions
written in the form {{{a1,a2},{b1,b2}},{x0,y0}}."

ComputePMatrix::usage = "ComputePMatrix[digraph_] estimates a 
probability matrix for digraph which generates a uniform distribution
of points over each digraph Fractal."

ComputeDigraphDimension::usage = "ComputeDimension[digraph_] computes a 
numerical estimate of the dimension of the corresponding digraph
fractals."

StronglyConnectedDigraphQ::usage = "StronglyConnectedDigraphQ[digraph_]
test the digraph to see if it is strongly connected."

Initiators::usage = "Initiators is an option for ShowDigraphFractals
indicating an initial list of Graphics primitives for the digraph
to operate on.  Initiators should be a list of lists of Graphics
primitives with length equal to the dimension of the digraph."

PMatrix::usage = "PMatrix is an option for 
ShowDigraphFractalsStochastic indicating a matrix of probabilities
for the functions in the digraph. in
ShowDigraphFractalsStochastic[digraph_, numPoints_], PMatrix->pMatrix],
pMatrix should be a matrix of lists of positive numbers with the same 
shape as digraph.  The sum of the sums of the lists in any column of 
PMatrix should be one."

Color::usage = "Color is an option to ShowDigraphFractalsStochastic. 
Setting Color -> True colors each point according to which function from 
the digraph IFS generated that point.  This distinguishes the constituent 
parts of the set."

Begin["`Private`"]

(* Set the Options *)

(* For ShowDigraphFractals *)
ShowDigraphFractalsOptions = Join[{AspectRatio -> Automatic,
		Initiators -> Automatic, Prolog -> {AbsolutePointSize[0.4]}},
		Options[Graphics]];
keywords = Complement[Union[First /@ ShowDigraphFractalsOptions], 
	{DisplayFunction, DefaultFont}];
vals = keywords /.  ShowDigraphFractalsOptions;
special = {DisplayFunction :> $DisplayFunction, DefaultFont :> $DefaultFont};
Options[ShowDigraphFractals] = 
	Union[Apply[Rule,Transpose[{keywords,vals}],{1}], special];

(* For ShowDigraphFractalsStochastic *)
ShowDigraphFractalsStochasticOptions = Join[{AspectRatio -> Automatic,
	PMatrix -> Automatic, Prolog -> {AbsolutePointSize[0.4]}, Color -> False},
	Options[Graphics]];
keywords = Complement[Union[First /@ ShowDigraphFractalsStochasticOptions], 
	{DisplayFunction, DefaultFont}];
vals = keywords /.  ShowDigraphFractalsStochasticOptions;
special = {DisplayFunction :> $DisplayFunction, DefaultFont :> $DefaultFont};
Options[ShowDigraphFractalsStochastic] = 
	Union[Apply[Rule,Transpose[{keywords,vals}],{1}], special];

(* The Functions *)

(* Error Messages *)
DigraphFractals::optx = "Unknown Option `1`."
DigraphFractals::badDigraph = "The first argument in `1` must be a
matrix of lists of affine lists."
DigraphFractals::badInt = "The second argument in `1` must be a
non-negative integer."
DigraphFractals::badOpt = "Options expected as optional arguments in `1`."


ShowDigraphFractals[digraph_, depth_, opts___] :=
	
	Module[{digraphFuncs, toFuncs, placeHolder, start, 
		graphicList, initiators, temp,
		valid = First /@ Options[ShowDigraphFractals]},

	Scan[If[!MemberQ[valid, First[#]],
		Message[DigraphFractals::optx, ToString[First[#]]]]&,
		Flatten[{opts}]
	];

	initiators = Initiators /. {opts} /. Options[ShowDigraphFractals];
	If[initiators === Automatic,
		initiators = Table[{Point[{0,0}]}, {Length[digraph]}]
	];
	

	toFuncs[{A_,b_}] := Module[{fOut, cfOut},
		fOut[{x_,y_}] := N[A.{x,y} + b] /; NumericQ[x] && NumericQ[y];
		cfOut = Compile[{{v,_Real,1}},
			A.v + b];
		fOut[Point[{x_,y_}]] := Point[cfOut[{x,y}]];
		fOut[x_List] := fOut /@ x;
		fOut[Line[x__]] := Line[cfOut /@ x];
		fOut[Polygon[x__]] := Polygon[cfOut /@ x];
		fOut[Disk[p_,r_]] := Disk[cfOut[p],r];
		fOut[Circle[p_,r_]] := Circle[cfOut[p],r];
		
		(* Why Doesn't This Work !??! *)
		fOut[Arrow[arrowStart_, arrowFinish_, arrowOpts___]] := 
			Arrow[fOut[arrowStart], fOut[arrowFinish], arrowOpts];
		
		fOut[h_[x__]] := h[x];
		fOut
	];
		
	start = placeHolder @@ # & /@ initiators;
	digraphFuncs = Map[toFuncs,digraph, {3}];
	digraphFuncs = Map[placeHolder @@ #  &, digraphFuncs, {2}] ;
	graphicList = Nest[Inner[Outer[#1[#2]&, #1, #2]&, digraphFuncs, #,List]&,
			start, depth] //. placeHolder[x___] -> {x};
	Show[Graphics[#], FilterOptions[Graphics,opts],
		FilterOptions[Graphics, 
			Sequence @@ Options[ShowDigraphFractals]]]& /@ graphicList
] /;
	(And @@ Flatten[Map[MatchQ[#,
		{{{a_?NumericQ, b_?NumericQ}, {c_?NumericQ, d_?NumericQ}},
		{e_?NumericQ, f_?NumericQ}}] &, digraph, {3}]] ||
		Message[DigraphFractals::badDigraph, ShowDigraphFractals] )  &&
	( (IntegerQ[depth] && depth >= 0 ) ||
		Message[DigraphFractals::badInt, ShowDigraphFractals, depth] ) &&
	( And @@ Map[OptionQ, {opts}] ||
	  	Message[DigraphFractals::badOpt,ShowDigraphFractals] )

ShowDigraphFractalsStochastic[digraph_, numPoints_, opts___] :=
	
  Module[{matrices, eigenvalues, s, sMatrix,
		spectralRadius, spectralRadius0,
		approximateDim, dimMatrix, perronNumbers,
		pMatrix1, pMatrix2, pMatrixNormalizer,
		toFuncs, digraphFuncs, v, v1, v2,
		currentPoint, points, choose, color,
		valid = First /@ Options[ShowDigraphFractalsStochastic]},

	Scan[If[!MemberQ[valid, First[#]],
		Message[DigraphFractals::optx, ToString[First[#]]]]&,
		Flatten[{opts}]
	];
	
	color = Color /. {opts} /. Options[ShowDigraphFractalsStochastic];

	(* Computing the Probabilities *)
	
	pMatrix = PMatrix /. {opts} /. Options[ShowDigraphFractalsStochastic];
	
	pMatrixNormalizer[subPList_List] := If[
		Length[subPList] > 0,
			FoldList[Plus, 0, subPList]/Plus @@ subPList,
			subPList];

	If[pMatrix === Automatic,
	    pMatrix = ComputePMatrix[digraph]];
		
	pMatrix = N[pMatrix];
	pMatrix2 = Transpose[Map[pMatrixNormalizer, pMatrix, {2}]];
	pMatrix1 = Map[Plus @@ # & , Transpose[pMatrix], {2}];
	pMatrix1 = FoldList[Plus, 0, #] & /@ pMatrix1;
	

	(* toFuncs[{A_, b_}] := A.# + b &; *)
	toFuncs[{A_,b_}] := Compile[{{v,_Real,1}},
		A.v + b];
	digraphFuncs = Map[toFuncs, N[digraph], {3}];
	v = 1; v1 = pMatrix1[[v]]; v2 = pMatrix2[[v]];
	currentPoint = {0., 0.};
	points = Table[{}, {Length[digraph]}];
	choose[v1_, v2_] := Module[
		{i, j, chooser},
		chooser = Random[];
		i = Length[Select[v1, (# < chooser) &]];
		chooser = Random[];
		j = Length[Select[v2[[i]], (# < chooser) &]];
		{i, j}];
		
	Do[{
		{i, j} = choose[v1, v2];
		currentPoint = 
			digraphFuncs[[i, v, j]][currentPoint];
		v = i;  v1 = pMatrix1[[v]];  v2 = pMatrix2[[v]];
		}, {20}];	

	Do[{
		{i, j} = choose[v1, v2];
		currentPoint = 
			digraphFuncs[[i, v, j]][currentPoint];
		points[[i]] = {points[[i]], {v, currentPoint}};
		v = i;  v1 = pMatrix1[[v]];  v2 = pMatrix2[[v]];
		}, {numPoints}];	
			
	pointColors = Hue /@ (Range[Length[digraph]] / Length[digraph]);
	If[color === True,
		points = points /. {v_Integer, p_} :>  {pointColors[[v]], Point[p]},
		points = points /. {v_Integer, p_} :>  Point[p]];
	
	Show[Graphics[#], FilterOptions[Graphics,opts],
		FilterOptions[Graphics, 
			Sequence @@ Options[ShowDigraphFractalsStochastic]]] & /@ points
	
(*	points = Partition[Flatten[#], 2] & /@ points;
	Show[Graphics[Point /@ #], FilterOptions[Graphics,opts],
		FilterOptions[Graphics, 
			Sequence @@ Options[ShowDigraphFractalsStochastic]]] & /@ points *)
] /;
	(And @@ Flatten[Map[MatchQ[#,
		{{{a_?NumericQ, b_?NumericQ}, {c_?NumericQ, d_?NumericQ}},
		{e_?NumericQ, f_?NumericQ}}] &, digraph, {3}]] ||
		Message[DigraphFractals::badDigraph, 
			ShowDigraphFractalsStochastic] )  &&
	( (IntegerQ[numPoints] && numPoints >= 0 ) ||
		Message[DigraphFractals::badInt, 
			ShowDigraphFractalsStochastic, numPoints] ) &&
	( And @@ Map[OptionQ, {opts}] ||
	  	Message[DigraphFractals::badOpt,ShowDigraphFractalsStochastic] )

ComputePMatrix[digraph_] := 

	Module[{
		matrices, eigenvalues, s, sMatrix,
		spectralRadius, spectralRadius0,
		approximateDim, dimMatrix, perronNumbers,
		pMatrix1, pMatrix2, pMatrixNormalizer},
		
		pMatrixNormalizer[subPList_List] := If[
			Length[subPList] > 0,
				subPList/Plus @@ subPList,subPList];
		matrices = Map[First, Transpose[digraph], {3}] // N;
		eigenMatrix = matrices /. 
			{{a_Real, b_Real}, {c_Real, d_Real}} -> 
			Max[Abs /@ Eigenvalues[{{a, b}, {c, d}}]]^s;
		sMatrix = Map[Plus @@ # &, eigenMatrix, {2}] // N;
		eigenvalues = Eigenvalues[sMatrix];
		spectralRadius0 = Max[Chop[Abs@N[eigenvalues /. s -> 0]]];
		spectralRadius = Select[eigenvalues, 
			((# /. s -> 0) == spectralRadius0) &][[1]];
		approximateDim = Chop[s /.
			FindRoot[spectralRadius == 1, {s, 1, 2}]];
		dimMatrix = sMatrix /. s -> approximateDim;
		perronNumbers = Eigensystem[dimMatrix][[2]][[1]];
		pMatrix1 = Inner[Times, dimMatrix,
			perronNumbers, List]/perronNumbers;
		pMatrix2 = eigenMatrix /. s -> approximateDim;
		pMatrix2 = Map[pMatrixNormalizer, pMatrix2, {2}];
		Transpose[pMatrix1 pMatrix2]
] /;
	(And @@ Flatten[Map[MatchQ[#,
		{{{a_?NumericQ, b_?NumericQ}, {c_?NumericQ, d_?NumericQ}},
		{e_?NumericQ, f_?NumericQ}}] &, digraph, {3}]] ||
		Message[DigraphFractals::badDigraph, 
			ComputePMatrix] )


ComputeDigraphDimension[digraph_] := Module[
	{matrices, eigenvalues, s, sMatrix,
		spectralRadius, spectralRadius0,
		approximateDim},

	matrices = Map[First, Transpose[digraph], {3}] // N;
	eigenMatrix = matrices /. 
		{{a_Real, b_Real}, {c_Real, d_Real}} -> 
		Max[Abs /@ Eigenvalues[{{a, b}, {c, d}}]]^s;
	sMatrix = Map[Plus @@ # &, eigenMatrix, {2}] // N;
	eigenvalues = Eigenvalues[sMatrix];
	spectralRadius0 = Max[Chop[Abs@N[eigenvalues /. s -> 0]]];
	spectralRadius = Select[eigenvalues, 
		((# /. s -> 0) == spectralRadius0) &][[1]];
	approximateDim = Chop[s /.
		FindRoot[spectralRadius == 1, {s, 1, 2}]]
] /;
	(And @@ Flatten[Map[MatchQ[#,
		{{{a_?NumericQ, b_?NumericQ}, {c_?NumericQ, d_?NumericQ}},
		{e_?NumericQ, f_?NumericQ}}] &, digraph, {3}]] ||
		Message[DigraphFractals::badDigraph, 
			ComputeDimension] )

StronglyConnectedDigraphQ[digraph_] := Module[
	{numericDigraph, k},
	
	numericDigraph = Map[Length, digraph, {2}];
	Length[Cases[
		Sum[MatrixPower[numericDigraph, k],
        	{k, 1, Length[numericDigraph]}], 0, {2}]] == 0
] /;
	(And @@ Flatten[Map[MatchQ[#,
		{{{a_?NumericQ, b_?NumericQ}, {c_?NumericQ, d_?NumericQ}},
		{e_?NumericQ, f_?NumericQ}}] &, digraph, {3}]] ||
		Message[DigraphFractals::badDigraph, 
			StronglyConnectedDigraphQ] )

End[]  (* End Private Context *)

Protect[DigraphFractals, ShowDigraphFractals, 
	ShowDigraphFractalsStochastic,
	ComputePMatrix, ComputeDigraphDimension,
	Initiators, PMatrix]

EndPackage[]
