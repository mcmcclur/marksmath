// Transcribed from the supplied clock face. Each expression equals its hour.
// Coordinates and maximum widths are fractions of the clock diameter.
export const labels = [
  {hour: 1, x:.68, y:.21, width:.16, tex:String.raw`-e^{i\pi}`},
  {hour: 2, x:.80, y:.33, width:.23, tex:String.raw`\frac{\gamma}{\int_0^\infty\frac{e^{-x^2}-e^{-x}}{x}\,dx}`, note:'γ is the Euler–Mascheroni constant.'},
  {hour: 3, x:.78, y:.5, width:.27, tex:String.raw`79\tan\!\left(\frac{\pi}{8}-\frac52\tan^{-1}\!\left(\frac17\right)\right)`},
  {hour: 4, x:.80, y:.68, width:.23, tex:String.raw`\frac{\pi}{\sum_{k=0}^\infty\frac{(-1)^k}{2k+1}}`},
  {hour: 5, x:.68, y:.775, width:.25, tex:String.raw`\frac{1}{\tan\!\left(\frac{\pi}{16}+\frac14\tan^{-1}\!\left(\frac1{239}\right)\right)}`},
  {hour: 6, x:.5, y:.865, width:.22, tex:String.raw`\frac{\pi^2}{\int_0^1\frac{\log(x)}{x-1}\,dx}`},
  {hour: 7, x:.32, y:.775, width:.25, tex:String.raw`\frac{1}{\tan\!\left(\frac\pi4-2\tan^{-1}\!\left(\frac13\right)\right)}`},
  {hour: 8, x:.20, y:.68, width:.23, tex:String.raw`\frac{\pi^2}{\sum_{k=0}^\infty\frac{1}{(2k+1)^2}}`},
  {hour: 9, x:.22, y:.5, width:.27, tex:String.raw`\left(\tan\!\left(\frac\pi9\right)\tan\!\left(\frac{2\pi}9\right)\tan\!\left(\frac{4\pi}9\right)\right)^4`},
  {hour:10, x:.20, y:.33, width:.21, tex:String.raw`\frac{\pi}{\csc^{-1}(2\varphi)}`, note:'φ = (1 + √5)/2 is the golden ratio; csc⁻¹ is inverse cosecant.'},
  {hour:11, x:.31, y:.21, width:.30, tex:String.raw`10^{12}+10^7-45\sum_{k=1}^{999}\csc^4\!\left(\frac{k\pi}{1000}\right)`},
  {hour:12, x:.5, y:.13, width:.24, tex:String.raw`\frac{\pi^2}{\int_0^\infty\frac{x}{\sinh(\sqrt3\,x)}\,dx}`}
];
