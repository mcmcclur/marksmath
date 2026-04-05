from dataclasses import dataclass, field
from typing import Optional, Tuple, Dict, List, Union
import ast
import math
import re
import types

from graphviz import Digraph 


# ============================================================
# Core node type
# ============================================================

@dataclass
class Node:
    op: str
    inputs: List["Node"] = field(default_factory=list)
    value: Optional[float] = None
    grad: float = 0.0
    name: Optional[str] = None
    param: Optional[float] = None

    def __hash__(self):
        return id(self)


# ============================================================
# Graph builder with interning
# ============================================================

class GraphBuilder:
    """
    Builds a DAG from a Python AST by interning repeated subexpressions.
    """

    def __init__(self):
        self.memo: Dict[Tuple, Node] = {}

    def intern(self, key: Tuple, make_node):
        if key not in self.memo:
            self.memo[key] = make_node()
        return self.memo[key]

    def input(self, name: str) -> Node:
        key = ("input", name)
        return self.intern(key, lambda: Node(op="input", name=name))

    def const(self, c: float, name: Optional[str] = None) -> Node:
        c = float(c)
        label = name if name is not None else repr(c)
        key = ("const", c, label)
        return self.intern(key, lambda: Node(op="const", value=c, name=label))

    def unary(self, op: str, a: Node) -> Node:
        key = (op, id(a))
        return self.intern(key, lambda: Node(op=op, inputs=[a]))

    def binary(self, op: str, a: Node, b: Node) -> Node:
        key = (op, id(a), id(b))
        return self.intern(key, lambda: Node(op=op, inputs=[a, b]))

    def pow_const(self, a: Node, p: float) -> Node:
        p = float(p)
        key = ("pow_const", id(a), p)
        return self.intern(
            key,
            lambda: Node(op="pow_const", inputs=[a], param=p, name=f"^{p:g}")
        )

    def negate(self, a: Node) -> Node:
        key = ("neg", id(a))
        return self.intern(key, lambda: Node(op="neg", inputs=[a]))


# ============================================================
# AST -> graph
# ============================================================

ALLOWED_FUNCS = {"sin", "cos", "exp", "log", "sigmoid", "relu"}
ALLOWED_CONSTS = {"pi": math.pi, "e": math.e}


def ast_to_graph(expr: str) -> Node:
    """
    Parse a Python expression and return the output node of the DAG.

    Supported:
      - variables: x, y, etc.
      - numbers
      - constants: pi, e
      - binary ops: +, -, *, /, **
      - unary minus
      - functions: sin, cos, exp, log

    Example:
        ast_to_graph("x**2 * y**3 + sin(pi*x**2*y**3) + 1")
    """
    tree = ast.parse(expr, mode="eval")
    builder = GraphBuilder()

    def convert(node) -> Node:
        if isinstance(node, ast.Expression):
            return convert(node.body)

        if isinstance(node, ast.Constant):
            if isinstance(node.value, (int, float)):
                return builder.const(float(node.value))
            raise ValueError(f"Unsupported constant: {node.value!r}")

        if isinstance(node, ast.Name):
            if node.id in ALLOWED_CONSTS:
                return builder.const(ALLOWED_CONSTS[node.id], name=node.id)
            return builder.input(node.id)

        if isinstance(node, ast.UnaryOp):
            a = convert(node.operand)
            if isinstance(node.op, ast.USub):
                return builder.negate(a)
            if isinstance(node.op, ast.UAdd):
                return a
            raise ValueError(f"Unsupported unary operator: {type(node.op).__name__}")

        if isinstance(node, ast.BinOp):
            a = convert(node.left)
            b = convert(node.right)

            if isinstance(node.op, ast.Add):
                return builder.binary("add", a, b)
            if isinstance(node.op, ast.Sub):
                return builder.binary("sub", a, b)
            if isinstance(node.op, ast.Mult):
                return builder.binary("mul", a, b)
            if isinstance(node.op, ast.Div):
                return builder.binary("div", a, b)
            if isinstance(node.op, ast.Pow):
                if b.op == "const":
                    return builder.pow_const(a, b.value)
                return builder.binary("pow", a, b)

            raise ValueError(f"Unsupported binary operator: {type(node.op).__name__}")

        if isinstance(node, ast.Call):
            if not isinstance(node.func, ast.Name):
                raise ValueError("Only simple function names are supported")

            fname = node.func.id
            if fname not in ALLOWED_FUNCS:
                raise ValueError(f"Unsupported function: {fname}")

            if len(node.args) != 1:
                raise ValueError(f"Function {fname} must take exactly one argument")

            a = convert(node.args[0])
            return builder.unary(fname, a)

        raise ValueError(f"Unsupported AST node: {type(node).__name__}")

    return convert(tree)


# ============================================================
# Topological order / reset
# ============================================================

def topo_sort(output_node: Node) -> List[Node]:
    visited = set()
    order = []

    def dfs(node: Node):
        if node in visited:
            return
        visited.add(node)
        for parent in node.inputs:
            dfs(parent)
        order.append(node)

    dfs(output_node)
    return order


def reset_graph(output_node: Node):
    """
    Reset gradients everywhere and clear cached values on non-constant nodes.
    """
    for node in topo_sort(output_node):
        node.grad = 0.0
        if node.op != "const":
            node.value = None


# ============================================================
# Forward propagation
# ============================================================

def forward(output_node: Node, env: Dict[str, float]) -> float:
    """
    Evaluate the graph at the input values in env.
    """
    for node in topo_sort(output_node):
        if node.op == "input":
            if node.name not in env:
                raise ValueError(f"Missing value for input '{node.name}'")
            node.value = float(env[node.name])

        elif node.op == "const":
            pass

        elif node.op == "add":
            a, b = node.inputs
            node.value = a.value + b.value

        elif node.op == "sub":
            a, b = node.inputs
            node.value = a.value - b.value

        elif node.op == "mul":
            a, b = node.inputs
            node.value = a.value * b.value

        elif node.op == "div":
            a, b = node.inputs
            node.value = a.value / b.value

        elif node.op == "pow":
            a, b = node.inputs
            node.value = a.value ** b.value

        elif node.op == "pow_const":
            (a,) = node.inputs
            node.value = a.value ** node.param

        elif node.op == "neg":
            (a,) = node.inputs
            node.value = -a.value

        elif node.op == "sin":
            (a,) = node.inputs
            node.value = math.sin(a.value)

        elif node.op == "cos":
            (a,) = node.inputs
            node.value = math.cos(a.value)

        elif node.op == "exp":
            (a,) = node.inputs
            node.value = math.exp(a.value)

        elif node.op == "log":
            (a,) = node.inputs
            node.value = math.log(a.value)

        elif node.op == "sigmoid":
            (a,) = node.inputs
            node.value = 1.0 / (1.0 + math.exp(-a.value))

        elif node.op == "relu":
            (a,) = node.inputs
            node.value = max(0.0, a.value)

        else:
            raise ValueError(f"Unknown op '{node.op}'")

    return output_node.value


# ============================================================
# Backward propagation
# ============================================================

def backward(output_node: Node):
    """
    Run reverse-mode automatic differentiation.
    Assumes forward(...) has already been called.
    """
    order = topo_sort(output_node)
    output_node.grad = 1.0

    for node in reversed(order):
        if node.op in {"input", "const"}:
            continue

        elif node.op == "add":
            a, b = node.inputs
            a.grad += node.grad
            b.grad += node.grad

        elif node.op == "sub":
            a, b = node.inputs
            a.grad += node.grad
            b.grad -= node.grad

        elif node.op == "mul":
            a, b = node.inputs
            a.grad += node.grad * b.value
            b.grad += node.grad * a.value

        elif node.op == "div":
            a, b = node.inputs
            a.grad += node.grad * (1 / b.value)
            b.grad += node.grad * (-a.value / (b.value ** 2))

        elif node.op == "pow":
            a, b = node.inputs
            a.grad += node.grad * b.value * (a.value ** (b.value - 1))
            b.grad += node.grad * node.value * math.log(a.value)

        elif node.op == "pow_const":
            (a,) = node.inputs
            p = node.param
            a.grad += node.grad * p * (a.value ** (p - 1))

        elif node.op == "neg":
            (a,) = node.inputs
            a.grad -= node.grad

        elif node.op == "sin":
            (a,) = node.inputs
            a.grad += node.grad * math.cos(a.value)

        elif node.op == "cos":
            (a,) = node.inputs
            a.grad += node.grad * (-math.sin(a.value))

        elif node.op == "exp":
            (a,) = node.inputs
            a.grad += node.grad * math.exp(a.value)

        elif node.op == "log":
            (a,) = node.inputs
            a.grad += node.grad * (1 / a.value)

        elif node.op == "sigmoid":
            (a,) = node.inputs
            a.grad += node.grad * node.value * (1.0 - node.value)

        elif node.op == "relu":
            (a,) = node.inputs
            a.grad += node.grad * (1.0 if a.value > 0 else 0.0)

        else:
            raise ValueError(f"Unknown op '{node.op}'")


# ============================================================
# GraphViz output
# ============================================================

def node_label(node: Node) -> str:
    if node.op == "input":
        return node.name
    if node.op == "const":
        return node.name
    if node.op == "add":
        return "+"
    if node.op == "sub":
        return "-"
    if node.op == "mul":
        return "×"
    if node.op == "div":
        return "/"
    if node.op == "pow":
        return "^"
    if node.op == "pow_const":
        return f"pow({node.param:g})"
    if node.op == "neg":
        return "neg"
    return node.op


def to_graphviz(
    output_node: Node,
    show_values: bool = False,
    show_grads: bool = False,
    show_init_values: bool = False,
    figure_size: Optional[Tuple[float, float]] = None,
    svg_size: Optional[Tuple[Union[float, str], Union[float, str]]] = None
) -> Digraph:
    """
    Return a graphviz.Digraph object.
    """
    order = topo_sort(output_node)
    ids = {node: f"n{i}" for i, node in enumerate(order)}

    dot = Digraph(name="ComputationGraph")
    dot.attr(rankdir="LR")
    dot.attr("node", fontsize="12")
    if figure_size is not None:
        width, height = figure_size
        dot.attr(size=f"{width},{height}")
    if svg_size is not None:
        width, height = svg_size

        def _repr_image_svg_xml(self):
            svg = self.pipe(format="svg").decode("utf-8")

            width_attr = str(width)
            height_attr = str(height)
            if re.search(r"\d$", width_attr):
                width_attr += "px"
            if re.search(r"\d$", height_attr):
                height_attr += "px"

            svg = re.sub(r'\swidth="[^"]*"', "", svg, count=1)
            svg = re.sub(r'\sheight="[^"]*"', "", svg, count=1)
            svg = re.sub(
                r"<svg\b",
                f'<svg width="{width_attr}" height="{height_attr}"',
                svg,
                count=1,
            )
            return svg

        dot._repr_image_svg_xml = types.MethodType(_repr_image_svg_xml, dot)

    for node in order:
        label = node_label(node)
        extras = []

        if show_values and node.value is not None:
            extras.append(f"val={node.value:.6g}")
        elif (
            show_init_values
            and node.op in {"input", "const"}
            and node.value is not None
        ):
            extras.append(f"val={node.value:.6g}")
        if show_grads and node.op != "const":
            extras.append(f"grad={node.grad:.6g}")

        if extras:
            label += "\n" + "\n".join(extras)

        shape = "box" if node.op in {"input", "const"} else "ellipse"
        dot.node(ids[node], label=label, shape=shape)

    for node in order:
        for parent in node.inputs:
            dot.edge(ids[parent], ids[node])

    return dot


# ============================================================
# Helpers / convenience wrappers
# ============================================================

def input_grads(output_node: Node) -> Dict[str, float]:
    result = {}
    for node in topo_sort(output_node):
        if node.op == "input":
            result[node.name] = node.grad
    return result


def evaluate(expr: str, **env: float) -> float:
    """
    Evaluate an expression directly from a string.
    """
    out = ast_to_graph(expr)
    reset_graph(out)
    return forward(out, env)


def gradient(expr: str, **env: float) -> Dict[str, float]:
    """
    Compute input gradients directly from a string.
    """
    out = ast_to_graph(expr)
    reset_graph(out)
    forward(out, env)
    backward(out)
    return input_grads(out)


def ast_to_graphviz(
    expr: str,
    show_values: bool = False,
    show_grads: bool = False,
    show_init_values: bool = False,
    figure_size: Optional[Tuple[float, float]] = None,
    svg_size: Optional[Tuple[Union[float, str], Union[float, str]]] = None,
    **env: float
) -> Digraph:
    """
    Parse an expression and return a Graphviz Digraph object.

    If input values are supplied via keyword arguments, the graph is evaluated
    before rendering so node values and gradients can be included in labels.
    """
    out = ast_to_graph(expr)

    if env:
        reset_graph(out)
        forward(out, env)
        if show_grads:
            backward(out)

    return to_graphviz(
        out,
        show_values=show_values,
        show_grads=show_grads,
        show_init_values=show_init_values,
        figure_size=figure_size,
        svg_size=svg_size,
    )


# ============================================================
# Demo
# ============================================================

if __name__ == "__main__":
    expr = "x**2 * y**3 + sin(pi*x**2*y**3) + 1"

    print("Expression:")
    print(expr)
    print()

    print("Value:")
    print(evaluate(expr, x=2.0, y=3.0))
    print()

    print("Gradient:")
    print(gradient(expr, x=2.0, y=3.0))
    print()

    g = ast_to_graphviz(expr)
    print("Graphviz source:")
    print(g.source)
