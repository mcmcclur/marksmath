import matplotlib.pyplot as plt
from itertools import combinations

def plot_combos(n,k, cols=2):
    #n = 5
    #k = 2 
    # cols = 2
    circle_radius = 0.35

    # --- generate sequences ---
    seqs = []
    for comb in combinations(range(n), k):
        s = ['T'] * n
        for i in comb:
            s[i] = 'H'
        seqs.append(s)

    rows = len(seqs) // cols

    # --- plot ---
    fig, ax = plt.subplots(figsize=(8, 6))
    ax.set_aspect('equal')
    ax.axis('off')

    # spacing
    dx = 1.0
    dy = 1.2

    for idx, seq in enumerate(seqs):
        r = idx // cols
        c = idx % cols
        
        x0 = c * (n + 1)
        y0 = -r * dy

        # draw circles
        for j, coin in enumerate(seq):
            x = x0 + j * dx
            y = y0
            
            if coin == 'H':
                circ = plt.Circle((x, y), circle_radius, color='black')
                ax.add_patch(circ)
                ax.text(x, y, 'H', color='white', ha='center', va='center',
                        fontsize=12, fontweight='bold')
            else:
                circ = plt.Circle((x, y), circle_radius,
                                edgecolor='black', facecolor='white')
                ax.add_patch(circ)
                ax.text(x, y, 'T', color='black', ha='center', va='center',
                        fontsize=12)

    for r in range(rows + 1):
        ax.plot([-0.5, cols * (n + 1) - 0.5], [-r * dy + 0.6, -r * dy + 0.6],
                color='black', lw=1)

    for c in range(cols + 1):
        ax.plot([c * (n + 1) - 0.5, c * (n + 1) - 0.5],
                [0.6, -rows * dy + 0.6], color='black', lw=1)

    plt.tight_layout()


def coin_flip_plot(
    seq,
    radius=0.5,
    gap=0.25,
    padding=0.25,
    fontsize=14
):
    """
    Plot coin flips with black heads and white tails.

    Parameters
    ----------
    seq : str
        Sequence like "HTHHT".
    radius : float
        Circle radius (main size control).
    gap : float
        Horizontal gap between circles.
    padding : float
        Extra vertical and horizontal margin.
    fontsize : int
        Label font size.
    """

    seq = seq.strip().upper()
    n = len(seq)

    diameter = 2 * radius
    width = n * diameter + (n - 1) * gap

    # Figure size automatically scales with circle size
    fig_height = 2 * (radius + padding)
    fig_width = width + 2 * padding

    fig, ax = plt.subplots(figsize=(fig_width, fig_height))

    for i, flip in enumerate(seq):
        if flip not in ["H", "T"]:
            raise ValueError("Sequence must contain only H and T.")

        x = i * (diameter + gap) + radius

        fill_color = "black" if flip == "H" else "white"
        text_color = "white" if flip == "H" else "black"

        circle = plt.Circle(
            (x, 0),
            radius,
            facecolor=fill_color,
            edgecolor="black",
            linewidth=2
        )
        ax.add_patch(circle)

        ax.text(
            x, 0, flip,
            ha="center", va="center",
            fontsize=fontsize,
            color=text_color
        )

    # Padding prevents clipping
    ax.set_xlim(-padding, width + padding)
    ax.set_ylim(-(radius + padding), (radius + padding))

    ax.set_aspect("equal")
    ax.axis("off")

    return fig, ax