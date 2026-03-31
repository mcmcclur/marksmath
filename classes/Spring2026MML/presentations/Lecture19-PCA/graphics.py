import numpy as np
import matplotlib.pyplot as plt

def make_projection_2d():
    # Define vectors
    b = np.array([4/5, 2/5])  # Small positive slope, shortened
    x = np.array([2, 2])  # Steeper slope

    # Compute the orthogonal projection of x onto b
    proj_x_b = (np.dot(x, b) / np.dot(b, b)) * b

    # Create the figure and axis
    fig, ax = plt.subplots()
    ax.axhline(0, color='black', linewidth=1)
    ax.axvline(0, color='black', linewidth=1)
    ax.set_xlim(-1, 3)
    ax.set_ylim(-0.5, 2.5)  # Increased top space
    ax.set_aspect('equal')  # Square aspect ratio
    ax.grid(True, linestyle='--', linewidth=0.5)

    # Plot the thin line along b
    b_line = np.array([-3, 3])  # Extend the line in both directions
    ax.plot(b_line, (b[1] / b[0]) * b_line, 'gray', linestyle='-', linewidth=1)
    ax.plot([x[0],proj_x_b[0]],[x[1],proj_x_b[1]], '--k')

    # Plot vectors
    ax.quiver(0, 0, x[0], x[1], angles='xy', scale_units='xy', scale=1, color='red', label=r'$\mathbf{x}$')
    ax.quiver(0, 0, proj_x_b[0], proj_x_b[1], angles='xy', scale_units='xy', scale=1, color='green', linestyle='dashed', label=r'$\text{proj}_b(\mathbf{x})$')
    ax.quiver(0, 0, b[0], b[1], angles='xy', scale_units='xy', scale=1, color='blue', label=r'$\mathbf{b}$')

    # Annotate vectors
    ax.text(b[0], b[1], r'$\mathbf{b}$', fontsize=12, verticalalignment='bottom', horizontalalignment='right')
    ax.text(x[0], x[1], r'$\mathbf{x}$', fontsize=12, verticalalignment='bottom', horizontalalignment='right')
    ax.text(proj_x_b[0], proj_x_b[1], r'$P(\mathbf{x})$', fontsize=12, verticalalignment='top', horizontalalignment='left')

    ax.set_xticklabels([])
    ax.set_yticklabels([])

    # Show the plot
    # plt.legend()
    plt.show()