import matplotlib.pyplot as plt
import matplotlib as mpl
from matplotlib.path import Path
import matplotlib.patches as patches

def set_spines(ax):
    ax.spines['left'].set_position('zero')
    ax.spines['right'].set_color('none')
    ax.spines['bottom'].set_position('zero')
    ax.spines['top'].set_color('none')

    xaxis,yaxis = ax.findobj(mpl.axis.Axis)
    xticks = xaxis.get_major_ticks()
    for tick in xticks:
        tick.get_children()[1].set_color('w')
    yticks = yaxis.get_major_ticks()
    for tick in yticks:
        tick.get_children()[1].set_color('w')


def uniform_density():
    ax = plt.subplot(121)
    plt.plot([0,2],[1/2,1/2], 'k', linewidth=2)
    #ax = plt.gca()
    ax.set_xlim(-0.2,2.2)
    ax.set_ylim(-0.2,1.2)
    ax.set_xticks([2.0])
    ax.set_yticks([0.5,1])
    ax.set_aspect(1)
    set_spines(ax);

    ax = plt.subplot(122)
    plt.plot([0,2],[1/2,1/2], 'k', linewidth=2)
    ax.set_xlim(-0.2,2.2)
    ax.set_ylim(-0.2,1.2)
    ax.set_xticks([0.5,1,2])
    ax.set_yticks([0.5,1])
    ax.set_aspect(1)
    ax.fill_between([0.5,1],0,0.5, color='lightgray')
    plt.plot([0.5,0.5],[0,0.5], 'k--', linewidth=1)
    plt.plot([1,1],[0,0.5], 'k--', linewidth=1)

    set_spines(ax);

    fig = plt.gcf()
    fig.set_size_inches(16,8)


def uniform_limit():
    for i in range(1,101):
        plt.plot([i,i],[0,0.01], 'k', linewidth=1/2)
        plt.plot([i],[0.01], 'ko', markersize=3)
    plt.plot([0,100],[0.01,0.01], 'k', linewidth=1)
        
    ax = plt.gca()
    ax.set_yticks([0.01])
    ax.set_ylim([0,0.1])

    fig = plt.gcf()
    fig.set_figwidth(13)
    fig.set_figheight(4)