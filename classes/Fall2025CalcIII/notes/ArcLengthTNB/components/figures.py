import numpy as np
import matplotlib.pyplot as plt

def draw_circle_with_center():
    # Circle parameters
    center = (2, 2)
    radius = 2 * np.sqrt(2)

    # Create the figure
    fig, ax = plt.subplots()

    # Add the circle
    circle = plt.Circle(center, radius, fill=False, color='blue', linewidth=2)
    ax.add_patch(circle)

    # Mark the center
    ax.plot(center[0], center[1], 'ro')

    # Formatting
    ax.set_aspect('equal', adjustable='box')
    ax.set_xlim(-2, 8)
    ax.set_ylim(-2, 8)
    plt.axhline(0, color='gray', linewidth=0.5)
    plt.axvline(0, color='gray', linewidth=0.5)
    plt.show()


def draw_line_through_point_and_vector():
    # Given point and vector
    P = np.array([-1, 1])   # point (-1,1)
    v = np.array([3, 1])    # vector <3,1>

    # Generate parameter values
    t_vals = np.linspace(-2, 4, 100)
    line_points = P[:, None] + v[:, None] * t_vals

    # Plot the line
    plt.plot(line_points[0], line_points[1], 'k-')

    # Mark the point P
    plt.plot(P[0], P[1], 'ro')

    # Draw the vector v starting at P (thicker, drawn last so it's on top)
    plt.arrow(P[0], P[1], v[0], v[1],
            head_width=0.2, head_length=0.3,
            fc='blue', ec='blue',
            linewidth=2.5, length_includes_head=True)

    # Formatting
    plt.axhline(0, color='gray', linewidth=0.5)
    plt.axvline(0, color='gray', linewidth=0.5)
    plt.gca().set_aspect('equal', adjustable='box')
    plt.xlim(-5, 10)
    plt.ylim(-2, 6)

    plt.show()