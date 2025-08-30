export const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 55" fill="currentColor">
  <defs>
    <clipPath id="gauge-clip"><rect x="0" y="0" width="100" height="52"/></clipPath>

    <!-- Outer arc geometry (radius 40, stroke 8) -->
    <path id="outerArc" d="M 10 50 A 40 40 0 0 1 90 50" pathLength="100"/>

    <!-- Inner arc geometry (radius 31) -->
    <path id="innerArc" d="M 19 50 A 31 31 0 0 1 81 50" pathLength="100"/>
  </defs>

  <g clip-path="url(#gauge-clip)" stroke="currentColor" fill="none" stroke-linecap="butt">
    <!-- Outer background arc -->
    <use href="#outerArc" stroke-width="8" opacity="0.2"/>

    <!-- Value arc: 65% -->
    <use href="#outerArc" stroke-width="8" stroke-dasharray="65 100"/>

    <!-- Inner legend segments (single geometry with dash windows) -->
    <!-- 0–60% -->
    <use href="#innerArc" stroke-width="4" opacity="0.2"
         stroke-dasharray="60 100" stroke-dashoffset="0"/>
    <!-- 60–80% -->
    <use href="#innerArc" stroke-width="4" opacity="0.4"
         stroke-dasharray="20 100" stroke-dashoffset="60"/>
    <!-- 0–100% (full half-circle), same color as value arc -->
    <use href="#innerArc" stroke-width="4"
         stroke-dasharray="100 100" stroke-dashoffset="0"/>
    <!-- (Alternatively, you can omit dash attributes entirely on this one:
         <use href="#innerArc" stroke-width="4"/> ) -->
  </g>
</svg>
`;
