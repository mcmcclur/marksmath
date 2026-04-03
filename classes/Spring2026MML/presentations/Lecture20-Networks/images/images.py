from graphviz import Graph

def complete_graph(n: int) -> Graph:
    """
    Return the complete graph K_n as a graphviz.Graph object
    using a circo layout.

    Parameters
    ----------
    n : int
        Number of vertices.

    Returns
    -------
    graphviz.Graph
        A Graphviz graph object representing K_n.
    """
    if n < 0:
        raise ValueError("n must be nonnegative")

    g = Graph("K_n", engine="circo")
    g.attr("node", shape="circle", width="0.35", fixedsize="true")

    # Add vertices
    for i in range(n):
        g.node(str(i), label=str(i))

    # Add edges
    for i in range(n):
        for j in range(i + 1, n):
            g.edge(str(i), str(j))

    return g


def make_house():
    g = Graph("G", engine="neato")

    # A few styling options
    g.attr(overlap="false", splines="true")
    g.attr("node", shape="circle", width="0.4", fixedsize="true", fontsize="14")

    # Vertex positions and degree labels
    # Square vertices:
    # A = bottom-left, B = bottom-right, C = top-right, D = top-left
    # E = center, F = above the square
    vertices = {
        "A": {"pos": "0,0!", "label": "3"},
        "B": {"pos": "2,0!", "label": "3"},
        "C": {"pos": "2,2!", "label": "4"},
        "D": {"pos": "0,2!", "label": "4"},
        "E": {"pos": "1,1!", "label": "4"},
        "F": {"pos": "1,3!", "label": "2"},
    }

    # Add vertices
    for v, attrs in vertices.items():
        g.node(v, label=attrs["label"], pos=attrs["pos"], pin="true")

    # Add edges
    edges = [
        ("A", "B"), ("B", "C"), ("C", "D"), ("D", "A"),  # square
        ("E", "A"), ("E", "B"), ("E", "C"), ("E", "D"),  # center to all corners
        ("F", "C"), ("F", "D"),                          # top vertex to top corners
    ]

    for u, v in edges:
        g.edge(u, v)
    return g
