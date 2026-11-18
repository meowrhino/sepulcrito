# recorta la estrella del mockup (fondo blanco) a PNG con transparencia:
# el cuerpo pixelado opaco, el halo rosa semitransparente
import sys
from collections import deque
from PIL import Image, ImageFilter
im=Image.open(sys.argv[1]).convert('RGB').crop((430,180,850,580)); W,H=im.size; px=im.load()
def relleno(test):
  m=[[False]*W for _ in range(H)]; q=deque([(x,y) for x in range(W) for y in (0,H-1)]+[(x,y) for y in range(H) for x in (0,W-1)])
  while q:
    x,y=q.popleft()
    if not(0<=x<W and 0<=y<H) or m[y][x] or not test(*px[x,y]): continue
    m[y][x]=True; q.extend(((x+1,y),(x-1,y),(x,y+1),(x,y-1)))
  return m
estricto=relleno(lambda r,g,b: b>g+15 or min(r,g,b)>246)          # no entra en la piel, pero deja un aro de halo flojo
suelto=relleno(lambda r,g,b: b>g+15 or (b>=g-2 and min(r,g,b)>200)) # se come el aro, y algún hueco de piel clara
R=int(sys.argv[3])
dentro=Image.new('L',im.size); d=dentro.load()
for y in range(H):
  for x in range(W): d[x,y]=0 if estricto[y][x] else 255
nucleo=dentro.filter(ImageFilter.MinFilter(2*R+1)).load()  # lo que está a más de R px del halo: seguro estrella
out=Image.new('RGBA',im.size); op=out.load()
for y in range(H):
  for x in range(W):
    r,g,b=px[x,y]
    if nucleo[x,y] or not suelto[y][x]: op[x,y]=(r,g,b,255); continue
    a=255-min(r,g,b)
    f=lambda c:int(max(0,min(255,(c-(255-a))*255/a))) if a else 0
    op[x,y]=(f(r),f(g),f(b),a)
out.crop(out.getbbox()).save(sys.argv[2])
