import matplotlib.pyplot as plt
import numpy as np

def draw_taxicab():
    # Define start and end points
    start = (5, 2)
    end = (0, 0)

    # Generate Manhattan path (only horizontal and vertical moves)
    path = []
    x, y = start
    while y > 0:
        path.append((x, y))
        y -= 1
    while x > 0:
        path.append((x, y))
        x -= 1
    path.append((0, 0))  # Ensure (0,0) is included

    # Extract path coordinates
    path_x, path_y = zip(*path)


    # Create the grid
    fig, ax = plt.subplots(figsize=(7, 4))
    ax.set_xticks(np.arange(-1, 6, 1))
    ax.set_yticks(np.arange(-1, 3, 1))
    ax.grid(True, linestyle="--", linewidth=0.5)

    # Plot the Manhattan path
    ax.plot(path_x, path_y, marker="o", color="black", linestyle="-", linewidth=2, markersize=6)
    arrow_scale = 0.97  # Scale factor to shorten arrow
    vec_x = start[0] * arrow_scale
    vec_y = start[1] * arrow_scale
    ax.arrow(0, 0, vec_x, vec_y, head_width=0.2, head_length=0.2, fc='black', ec='black', linestyle='dashed')

    # Mark the start and end points
    ax.text(5, 2, "(5,2)", fontsize=12, verticalalignment='bottom', horizontalalignment='right', color="black")
    ax.text(0, 0, "(0,0)", fontsize=12, verticalalignment='top', horizontalalignment='right', color="black")

    # Set limits and labels
    ax.set_xlim(-1, 6)
    ax.set_ylim(-1, 3)
    # ax.legend()

    # Show plot
    plt.show()

def draw_unit_circle():
    fig, ax = plt.subplots(figsize=(5, 3))
    ax.set_xticks(np.arange(-2,3, 1))
    ax.set_yticks(np.arange(-2,3, 1))
    ax.grid(True, linestyle="--", linewidth=0.5)
    ax.set_xlim(-2.5, 2.5)
    ax.set_ylim(-1.5, 1.5)
    ax.set_aspect('equal')

    circle = plt.Circle((0, 0), 1, 
        color='black', fill=True, 
        alpha=0.1
    )  
    ax.add_patch(circle)

    # Plot the unit circle outline
    theta = np.linspace(0, 2 * np.pi, 300)
    ax.plot(np.cos(theta), np.sin(theta), color='black', linewidth=1)

    plt.show()

def draw_diamond():
    fig, ax = plt.subplots(figsize=(5, 3))
    ax.set_xticks(np.arange(-2,3, 1))
    ax.set_yticks(np.arange(-2,3, 1))
    ax.grid(True, linestyle="--", linewidth=0.5)
    ax.set_xlim(-2.5, 2.5)
    ax.set_ylim(-1.5, 1.5)
    ax.set_aspect('equal')

    # Define the diamond (Manhattan unit ball)
    diamond_vertices = np.array([[1, 0], [0, 1], [-1, 0], [0, -1], [1, 0]])  # Closing the shape
    ax.fill(diamond_vertices[:, 0], diamond_vertices[:, 1], color='black', alpha=0.1)  # Light gray fill
    ax.plot(diamond_vertices[:, 0], diamond_vertices[:, 1], color='black', linewidth=1)  # Outline

    plt.show()



def draw_square(): 
    fig, ax = plt.subplots(figsize=(5, 3))
    ax.set_xticks(np.arange(-2,3, 1))
    ax.set_yticks(np.arange(-2,3, 1))
    ax.grid(True, linestyle="--", linewidth=0.5)
    ax.set_xlim(-2.5, 2.5)
    ax.set_ylim(-1.5, 1.5)
    ax.set_aspect('equal')

    # Define the square (Supremum norm unit ball)
    square_vertices = np.array([[1, 1], [-1, 1], [-1, -1], [1, -1], [1, 1]])  # Closing the shape
    ax.fill(square_vertices[:, 0], square_vertices[:, 1], color='black', alpha=0.1)  # Light gray fill
    ax.plot(square_vertices[:, 0], square_vertices[:, 1], color='black', linewidth=1)  # Outline

    # Show plot
    plt.show()

def triangle_inequality():
    u = np.array([5, 3])
    v = np.array([2, -1])
    sum_vector = u + v  # Compute u + v

    fig, ax = plt.subplots(figsize=(9,5))

    # Plot vectors
    ax.quiver(0, 0, *u, angles='xy', scale_units='xy', scale=1)
    ax.quiver(*u, *v, angles='xy', scale_units='xy', scale=1)
    ax.quiver(0, 0, *sum_vector, angles='xy', scale_units='xy', scale=1)

    # Set grid and limits
    ax.set_xlim(-1, 8)
    ax.set_ylim(-1, 4)
    ax.set_xticks(range(-1, 9))
    ax.set_yticks(range(-1, 5))
    ax.grid(True, linestyle='--', linewidth=0.5)

    # Add labels
    ax.text(2.6, 1.8, r'$\vec{x}$', fontsize=12)
    ax.text(5.8, 2.8, r'$\vec{y}$', fontsize=12)
    ax.text(3.7, 0.7, r'$\vec{x}+\vec{y}$', fontsize=12)


    # Show plot
    plt.show()
