<h1 align="center">
  <img src="https://i.ibb.co/zVtyfgmz/Bez-n-zvu-3.png" alt="Bez-n-zvu-3" border="0" width="600px">
  <br>
</h1>

<h4 align="center">Calculator for spillway flowthrough values</h4>

<br>

<p align="center">
<a href=""><img src="https://img.shields.io/github/release/LOKAI77/Hydroflow"></a>
</p>

# FEATURES

- **SVG** floor plan display of the spillway while setting parameters for easier orientation
- **Simulation** for water level up to 9999 m asl. with custom pacing
- **Export** calculation log feature into `.CSV`, `.XLSX` or `.TXT`
- **Switch axes** to compare flowthrough against the water level or vice versa

<br>
<h1 align="center">
<img src="https://i.ibb.co/KMqDgXK/Screenshot-2025-06-22-164009.png" alt="Screenshot-2025-06-22-131431" border="0" width="1200px">
</h1>

<br>

# ABOUT

<h2 align="left">Hydroflow</h1>

<h3 align="left">Overview</h3>

A web-based hydraulic engineering application that calculates spillway flow rates and generates consumption curves for various spillway configurations with different pillar types and arrangements.

<br>

<h3 align="left">How It Works</h3>

**<p>1) Hydraulic Calculation Engine</p>**
```text
Input Parameters → Flow Coefficient → Effective Width → Iterative Q Calculation → Results
```

**Parameter Input Interface**:
- **Spillway coefficient (m)**: 0.3-0.55 range for discharge calculations
- **Overflow elevation**: Reference level for spillway crest (m a.s.l.)
- **Water level elevation**: Current water surface elevation (m a.s.l.)
- **Spillway width (b)**: Effective spillway opening width in meters
- **Number of pillars (n)**: 0-5 structural supports affecting flow
- **Pillar shape selection**: Four geometric configurations affecting flow efficiency
- **Calculation range**: User-defined elevation range for consumption curve generation

**Core Formula Implementation:**:
- Base flow equation: `Q = m × b₀ × √(2g) × h^1.5`
- Effective width: `b₀ = b - 0.1 × ξ × n × h₀` (accounts for pillar contraction)
- Head correction: Iterative velocity head adjustment for accurate flow rates
- Pillar coefficients: Shape-dependent flow reduction factors (ξ)

<br>

**<p>2) Pillar Configuration</p>**
Shape Types & Coefficients:

- **Hranolovitý (Prismatic)**: ξ = 1.0 (rectangular cross-section)
- **Elipsovitý (Elliptical)**: ξ = 0.8 (rounded upstream/downstream faces)
- **Klínový (Wedge)**: ξ = 0.7 (pointed upstream face)
- **Klínový s mírným zužením**: ξ = 0.4 (optimized wedge design)

<br>

**<p>3) Consumption Curve Generation</p>**
Chart Features:

- Scatter plot with trend line showing water level vs. flow rate relationship
- Configurable elevation range with user-defined step intervals
- Axis swapping capability (Height vs Q or Q vs Height)

<br>



<h3 align="left">Technical Architecture</h3>

**Frontend**
- Chart.js 3.9.1 for consumption curve visualization
- SVG template system for spillway configuration display
- CSS3 Grid layout with responsive mobile breakpoints

**Calculation Engine**
- Iterative solver: 10-iteration convergence for velocity head correction
- Precision handling: Maintains accuracy for small elevation differences
- Range validation: Comprehensive input checking with user feedback
- Real-time updates: Instant recalculation on parameter changes

**Usage**
- `No installation` needed, program can run in browser
- Compiled into `.exe` with `electron-builder` for easier use and distribution

<br>

# INSTALLATION

Repository is provided with both compiled and uncompiled versions. Raw `.HTML` version can be executed straight in browser or you can compile it yourself into `.exe`. The compiled version contains already prepared executable ready-to-go. No additional download needed.

**<p>How to compile:</p>**

- **Step 1**: Download uncompilled version, and put everything in your project folder (`main.js`, `preload.js` and `renderer.js` are already included)
- **Step 2**: Download electron-builder
- **Step 3**: Compile with electron


```shell
:~$ git clone https://github.com/LOKAI77/Hydroflow/hydroflow-uncompiled
:~$ cd ~/hydroflow-uncompiled
:~$ npm init -y
:~$ npm install electron --save-dev
:~$ npm install electron-builder --save-dev
:~$ npx electron-builder build --win --x64
```


<br>

# NOTES

- Always cite the app in official documentation
- ⚠️ Results are for analysis purposes only; operators should verify integrity

<br>
<br>
