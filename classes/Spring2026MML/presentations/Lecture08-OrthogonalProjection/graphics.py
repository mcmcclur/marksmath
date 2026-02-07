import numpy as np
import matplotlib.pyplot as plt
import plotly.graph_objects as go

def make_projection_3d():
    # Define the plane: z = ax + by
    a, b = 0.2, 0.3  # Small slopes
    x_vals = np.linspace(-5, 5, 10)
    y_vals = np.linspace(-5, 5, 10)
    X, Y = np.meshgrid(x_vals, y_vals)
    Z = a * X + b * Y

    # Define the point off the plane
    point = np.array([3, 2, 5])  # Arbitrary point

    # Compute the projection onto the plane
    normal = np.array([a, b, -1])  # Normal to the plane
    normal = normal / np.linalg.norm(normal)  # Normalize it

    # Distance from the point to the plane along the normal
    d = (a * point[0] + b * point[1] - point[2]) / np.dot(normal, [a, b, -1])
    projection = point - d * normal  # Projected point

    # Function to shift cones slightly back along their direction
    def shift_cone_base(x, y, z, u, v, w, factor=0.1):
        return x - factor * u, y - factor * v, z - factor * w

    # Create the plot
    fig = go.Figure()

    # Add the plane
    fig.add_trace(go.Surface(
        x=X,y=Y,z=Z, 
        colorscale='Blues', opacity=0.5, 
        showscale=False, hoverinfo='none'
    ))

    fig.add_trace(
        go.Scatter3d(
            x=[point[0]], 
            y=[point[1]], 
            z=[point[2]],
            mode='markers+text', 
            text=["𝑥⃗"],
            textfont=dict(size=20),
            marker=dict(size=6, color='black'),
            name = "Point"
        )
    )

    fig.add_trace(
        go.Scatter3d(
            x=[projection[0]], 
            y=[projection[1]],
            z=[projection[2]],
            mode='markers+text', 
            text=["P(𝑥⃗)"],
            textfont=dict(size=20),
            textposition='middle right',
            marker=dict(size=6, color='black'), name='Projection'
        )
    )

    # Add line from origin to the point
    fig.add_trace(go.Scatter3d(x=[0, point[0]], y=[0, point[1]], z=[0, point[2]],mode='lines', line=dict(width=4, color='black'), name='Line to Point'))

    # Add line from origin to the projection
    fig.add_trace(go.Scatter3d(x=[0, projection[0]], y=[0, projection[1]], z=[0, projection[2]],mode='lines', line=dict(width=4, color='black'), name='Line to Projection'))

    # Add line from point to its projection
    fig.add_trace(go.Scatter3d(x=[projection[0], point[0]], y=[projection[1], point[1]], z=[projection[2], point[2]],mode='lines', line=dict(width=4, color='black'), name='Projection Line'))

    # Add cone arrowheads at the ends of the lines
    cone_size = 0.5
    x, y, z = shift_cone_base(projection[0], projection[1], projection[2], point[0] - projection[0], point[1] - projection[1], point[2] - projection[2], -0.12)
    fig.add_trace(go.Cone(x=[x], y=[y], z=[z],u=[projection[0] - point[0]], v=[projection[1] - point[1]], w=[projection[2] - point[2]],colorscale='Gray', showscale=False, sizemode='absolute', sizeref=cone_size))

    x, y, z = shift_cone_base(projection[0], projection[1], projection[2], projection[0], projection[1], projection[2],0.08)
    fig.add_trace(go.Cone(x=[x], y=[y], z=[z],u=[projection[0] - 0], v=[projection[1] - 0], w=[projection[2] - 0],colorscale='Gray', showscale=False, sizemode='absolute', sizeref=cone_size))


    x, y, z = shift_cone_base(point[0], point[1], point[2], point[0], point[1], point[2],0.06)
    fig.add_trace(go.Cone(x=[x], y=[y], z=[z],
    u=[point[0] - 0], v=[point[1] - 0], w=[point[2] - 0],
    colorscale='Gray', showscale=False, sizemode='absolute', sizeref=cone_size))

    # Layout adjustments with updated viewpoint
    fig.update_layout(
        scene=dict(
            xaxis_title='X',
            yaxis_title='Y',
            zaxis_title='Z',
            camera=dict(eye=dict(x=1.2, y=-1.2, z=0.8))
        ),
        showlegend=False,
        hovermode=False
    )
    fig.update_scenes(
        xaxis_showspikes=False, 
        yaxis_showspikes=False, 
        zaxis_showspikes=False
    )

    fig.show(config={'displayModeBar': False})
    

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
    ax.quiver(0, 0, x[0], x[1], angles='xy', scale_units='xy', scale=1, color='red', label=r'$\vec{x}$')
    ax.quiver(0, 0, proj_x_b[0], proj_x_b[1], angles='xy', scale_units='xy', scale=1, color='green', linestyle='dashed', label=r'$\text{proj}_b(\vec{x})$')
    ax.quiver(0, 0, b[0], b[1], angles='xy', scale_units='xy', scale=1, color='blue', label=r'$\vec{b}$')

    # Annotate vectors
    ax.text(b[0], b[1], r'$\vec{b}$', fontsize=12, verticalalignment='bottom', horizontalalignment='right')
    ax.text(x[0], x[1], r'$\vec{x}$', fontsize=12, verticalalignment='bottom', horizontalalignment='right')
    ax.text(proj_x_b[0], proj_x_b[1], r'$P(\vec{x})$', fontsize=12, verticalalignment='top', horizontalalignment='left')

    ax.set_xticklabels([])
    ax.set_yticklabels([])

    # Show the plot
    # plt.legend()
    plt.show()

def make_projection_matrix_3d():
    # Define vectors
    b = np.array([1, -1, 2])
    x = np.array([3, 4, 5])

    # Compute projection P(x)
    b_T_x = np.dot(b, x)
    b_T_b = np.dot(b, b)
    P_x = (b_T_x / b_T_b) * b  # Projection formula

    # Small shift to move the cone base back slightly
    shift_factor = 0.1
    b_shifted = b - shift_factor * b / np.linalg.norm(b)
    x_shifted = x - shift_factor * x / np.linalg.norm(x)
    P_x_shifted = P_x - shift_factor * P_x / np.linalg.norm(P_x)

    # Origin
    origin = np.array([0, 0, 0])

    # Create figure
    fig = go.Figure()

    # Add vector b as a line
    fig.add_trace(go.Scatter3d(
        x=[origin[0], b[0]], y=[origin[1], b[1]], z=[origin[2], b[2]],
        mode="lines",
        line=dict(width=4, color="blue"),
        name="b"
    ))

    # Add vector x as a line
    fig.add_trace(go.Scatter3d(
        x=[origin[0], x[0]], y=[origin[1], x[1]], z=[origin[2], x[2]],
        mode="lines",
        line=dict(width=4, color="red"),
        name="x"
    ))

    # Add projected vector P(x) as a line
    fig.add_trace(go.Scatter3d(
        x=[origin[0], P_x[0]], y=[origin[1], P_x[1]], z=[origin[2], P_x[2]],
        mode="lines",
        line=dict(width=4, color="green"),
        name="P(x)"
    ))

    # Add dashed line from x to P(x) to show projection
    fig.add_trace(go.Scatter3d(
        x=[x[0], P_x[0]], y=[x[1], P_x[1]], z=[x[2], P_x[2]],
        mode="lines",
        line=dict(width=2, color="black", dash="dash"),
        name="Projection Line"
    ))

    # Add cone for vector b
    fig.add_trace(go.Cone(
        x=[b_shifted[0]], y=[b_shifted[1]], z=[b_shifted[2]],
        u=[b[0]], v=[b[1]], w=[b[2]],
        sizemode="absolute",
        sizeref=0.4,
        colorscale=[[0, "blue"], [1, "blue"]],
        showscale=False
    ))

    # Add cone for vector x
    fig.add_trace(go.Cone(
        x=[x_shifted[0]], y=[x_shifted[1]], z=[x_shifted[2]],
        u=[x[0]], v=[x[1]], w=[x[2]],
        sizemode="absolute",
        sizeref=0.4,
        colorscale=[[0, "red"], [1, "red"]],
        showscale=False
    ))

    # Add cone for projected vector P(x)
    fig.add_trace(go.Cone(
        x=[P_x_shifted[0]], y=[P_x_shifted[1]], z=[P_x_shifted[2]],
        u=[P_x[0]], v=[P_x[1]], w=[P_x[2]],
        sizemode="absolute",
        sizeref=0.4,
        colorscale=[[0, "green"], [1, "green"]],
        showscale=False
    ))

    # Add annotations for labels
    fig.add_trace(go.Scatter3d(
        x=[b[0], x[0], P_x[0]], y=[b[1], x[1], P_x[1]], z=[b[2], x[2], P_x[2]],
        mode="text",
        text=["b", "x", "P(x)"],
        textposition="top center",
        textfont=dict(size=14, color="black")
    ))

    # Layout settings
    fig.update_layout(
        scene=dict(
            xaxis_title="X",
            yaxis_title="Y",
            zaxis_title="Z",
            aspectmode="cube",
            camera=dict(eye=dict(x=1.5, y=1, z=0.8))
        ),
        showlegend=False,
    )

    fig.show(config={'displayModeBar': False})
    
def make_multi_proj_example():
    # Define vectors
    origin = np.array([0, 0, 0])
    v1 = np.array([1, 2, 3])
    v2 = np.array([2, -1, 1])
    x = np.array([4, 5, 6])
    proj_x = np.array([3, 4, 7])

    # Define spanning plane: extend it to fully contain proj_x
    span_scale = 2  # Extend the plane beyond the basis vectors
    p1 = span_scale * v1
    p2 = span_scale * v2
    p3 = span_scale * (v1 + v2)

    plane_x = [0, p1[0], p3[0], p2[0]]
    plane_y = [0, p1[1], p3[1], p2[1]]
    plane_z = [0, p1[2], p3[2], p2[2]]

    # Offset for cones so they appear at vector tips
    cone_offset = 0.9

    # Create figure
    fig = go.Figure()

    # Add spanning plane
    fig.add_trace(go.Mesh3d(
        x=plane_x, y=plane_y, z=plane_z,
        color='cyan', opacity=0.5))

    # Add vectors as lines
    fig.add_trace(go.Scatter3d(x=[0, v1[0]], y=[0, v1[1]], z=[0, v1[2]], mode='lines',
                               line=dict(color='blue', width=5), name='v1'))
    fig.add_trace(go.Scatter3d(x=[0, v2[0]], y=[0, v2[1]], z=[0, v2[2]], mode='lines',
                               line=dict(color='green', width=5), name='v2'))
    fig.add_trace(go.Scatter3d(x=[0, x[0]], y=[0, x[1]], z=[0, x[2]], mode='lines',
                               line=dict(color='red', width=5), name='x (original vector)'))
    fig.add_trace(go.Scatter3d(x=[0, proj_x[0]], y=[0, proj_x[1]], z=[0, proj_x[2]], mode='lines',
                               line=dict(color='purple', width=5), name='proj_B(x)'))

    # Add cones at the tips of the vectors, and disable the colorbar
    fig.add_trace(go.Cone(x=[cone_offset * v1[0]], y=[cone_offset * v1[1]], z=[cone_offset * v1[2]], 
                          u=[v1[0]], v=[v1[1]], w=[v1[2]], 
                          colorscale=[[0, 'blue'], [1, 'blue']], sizemode="absolute", sizeref=0.6,
                          name="Tip of v1", showscale=False))
    fig.add_trace(go.Cone(x=[cone_offset * v2[0]], y=[cone_offset * v2[1]], z=[cone_offset * v2[2]], 
                          u=[v2[0]], v=[v2[1]], w=[v2[2]], 
                          colorscale=[[0, 'green'], [1, 'green']], sizemode="absolute", sizeref=0.6,
                          name="Tip of v2", showscale=False))
    fig.add_trace(go.Cone(x=[cone_offset * x[0]], y=[cone_offset * x[1]], z=[cone_offset * x[2]], 
                          u=[x[0]], v=[x[1]], w=[x[2]], 
                          colorscale=[[0, 'red'], [1, 'red']], sizemode="absolute", sizeref=0.6,
                          name="Tip of x", showscale=False))
    fig.add_trace(go.Cone(x=[cone_offset * proj_x[0]], y=[cone_offset * proj_x[1]], z=[cone_offset * proj_x[2]], 
                          u=[proj_x[0]], v=[proj_x[1]], w=[proj_x[2]], 
                          colorscale=[[0, 'purple'], [1, 'purple']], sizemode="absolute", sizeref=0.6,
                          name="Tip of proj_B(x)", showscale=False))

    # Add dashed line connecting x to its projection
    fig.add_trace(go.Scatter3d(x=[x[0], proj_x[0]], y=[x[1], proj_x[1]], z=[x[2], proj_x[2]],
                               mode='lines', line=dict(color='gray', width=2, dash='dash'),
                               name='Error (x - proj_B(x))'))

    # Layout settings
    fig.update_layout(
        scene=dict(
            xaxis_title='X',
            yaxis_title='Y',
            zaxis_title='Z'
        ),
        showlegend=False
    )

    # Display the figure
    fig.show(config={'displayModeBar': False})
