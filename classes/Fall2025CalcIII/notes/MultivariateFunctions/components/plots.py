import numpy as np
import plotly.graph_objects as go

def plot(f, xrange, yrange):
    x = np.linspace(xrange[0], xrange[1], 201)
    y = np.linspace(yrange[0], yrange[1], 201)
    X, Y = np.meshgrid(x, y)
    Z = f(X,Y)

    surf = go.Surface(
        x=X, y=Y, z=Z,
        colorscale="RdBu_r",
        contours=dict(
            x=dict(show=True, start=-3, end=3, size=1),
            y=dict(show=True, start=-3, end=3, size=1),
            # z=dict(show=True, project=dict(z=True), start=-6, end=6, size=1),
        ),
        showscale=False,
        lighting=dict(ambient=0.6, diffuse=0.7, specular=0.1, roughness=0.9),
        lightposition=dict(x=100, y=200, z=300),
        hovertemplate="x=%{x:.2f}<br>y=%{y:.2f}<br>z=%{z:.2f}<extra></extra>",
    )

    fig = go.Figure(surf)
    fig.update_layout(
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        scene=dict(
            xaxis_title="x", yaxis_title="y", zaxis_title="z",
            aspectmode="manual",
            aspectratio=dict(x=1, y=1, z=0.6),
            xaxis=dict(nticks=7, gridcolor="rgba(0,0,0,0.2)"),
            yaxis=dict(nticks=7, gridcolor="rgba(0,0,0,0.2)"),
            zaxis=dict(nticks=7, gridcolor="rgba(0,0,0,0.2)"),
        ),
        margin=dict(l=0, r=0, t=40, b=0),
    )

    return fig
