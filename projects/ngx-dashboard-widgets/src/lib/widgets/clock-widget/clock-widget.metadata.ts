export const svgIcon = `
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid meet">
  <use transform="matrix(-1,0,0,1,800,0)" href="#one-half" />
  <g id="one-half">
    <g id="one-fourth">
      <path d="m400 40v107" stroke-width="26.7" stroke="currentColor" />
      <g id="one-twelfth">
        <path
          d="m580 88.233-42.5 73.612"
          stroke-width="26.7"
          stroke="currentColor"
        />
        <g id="one-thirtieth">
          <path
            id="one-sixtieth"
            d="m437.63 41.974-3.6585 34.808"
            stroke-width="13.6"
            stroke="currentColor"
          />
          <use transform="rotate(6 400 400)" href="#one-sixtieth" />
        </g>
        <use transform="rotate(12 400 400)" href="#one-thirtieth" />
      </g>
      <use transform="rotate(30 400 400)" href="#one-twelfth" />
      <use transform="rotate(60 400 400)" href="#one-twelfth" />
    </g>
    <use transform="rotate(90 400 400)" href="#one-fourth" />
  </g>
  <path
    class="clock-hour-hand"
    id="anim-clock-hour-hand"
    fill="currentColor"
    d="m 381.925,476 h 36.15 l 5e-4,-300.03008 L 400,156.25 381.9245,175.96992 Z"
    transform="rotate(110.2650694444, 400, 400)"
  />
  <path
    class="clock-minute-hand"
    id="anim-clock-minute-hand"
    fill="currentColor"
    d="M 412.063,496.87456 H 387.937 L 385.249,65.68306 400,52.75 414.751,65.68306 Z"
    transform="rotate(243.1808333333, 400, 400)"
  />
</svg>
`;
