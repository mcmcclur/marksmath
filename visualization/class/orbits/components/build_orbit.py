import numpy as np
from scipy.optimize import brentq
from scipy.integrate import odeint
from scipy.interpolate import interp1d


# Parameters
G = 3
x0 = 1
y0 = 0
vx0 = 0
vy0 = 1

# In the following definition of F, s is a state vector whose components represent the following:
#   s[0]: Horizontal or x position
#   s[1]: Vertical or y position
#   s[2]: Horizontal velocity
#   s[3]: Vertical velocity
# In general, F can depend upon time t as well. Although our F is independent of t, we still need to
# indicate that it is a possible variable.

def F(s,t): return [s[2],s[3],
    -G*s[0]/(s[0]**2 + s[1]**2)**(3/2),
    -G*s[1]/(s[0]**2 + s[1]**2)**(3/2),
]

# Solution too broad
t = np.linspace(0,2,50)
solution = odeint(F,[x0,y0,vx0,vy0],t)

# Solution right size
y = solution[:,1]
f = interp1d(t, y)
period = brentq(f,1,2)
t = np.linspace(0,period,1001)
solution = odeint(F,[x0,y0,vx0,vy0],t)
x = solution[:,0]
y = solution[:,1]

data = []
cnt = 0
for d in np.delete(solution, -1, 0):
    data.append({
      "t": t[cnt], 
      "x":d[0], "y":d[1], 
      "speed":np.sqrt(d[2]**2+d[3]**2)
    })
    cnt=cnt+1
data.append({
    'x': 1, 'y': 0, 
    't': period, 
    'speed':1
})
