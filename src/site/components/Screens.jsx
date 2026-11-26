/**
 * Interface sketches for the build-log cards: one stylised screen per
 * project, drawn in SVG so they stay sharp at any size. The numbers on them
 * are illustrative.
 */

const C = {
  bg: '#0b1220',
  panel: '#111b2d',
  line: 'rgba(160,190,240,0.14)',
  dim: 'rgba(200,215,240,0.35)',
  text: 'rgba(230,238,255,0.85)',
  blue: '#6fb6ff',
  cyan: '#6fe3ff',
  amber: '#ffa860',
  green: '#7dffb0',
};

const mono = { fontFamily: 'IBM Plex Mono, monospace', letterSpacing: 1 };

function Frame({ id, glow = C.blue, title, children }) {
  return (
    <svg viewBox="0 0 300 400" className="size-full" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-glow`} cx="70%" cy="10%" r="90%">
          <stop offset="0" stopColor={glow} stopOpacity="0.28" />
          <stop offset="1" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        <pattern id={`${id}-grid`} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="rgba(160,190,240,0.05)" />
        </pattern>
      </defs>
      <rect width="300" height="400" fill={C.bg} />
      <rect width="300" height="400" fill={`url(#${id}-grid)`} />
      <rect width="300" height="400" fill={`url(#${id}-glow)`} />
      {/* Window chrome. */}
      <g transform="translate(22 62)">
        <rect width="256" height="316" rx="10" fill={C.panel} stroke={C.line} />
        <circle cx="14" cy="14" r="3" fill={C.dim} />
        <circle cx="24" cy="14" r="3" fill={C.dim} />
        <circle cx="34" cy="14" r="3" fill={glow} />
        <text x="242" y="17" textAnchor="end" fontSize="7" fill={C.dim} style={mono}>
          {title}
        </text>
        <line x1="0" y1="28" x2="256" y2="28" stroke={C.line} />
        <g transform="translate(14 42)">{children}</g>
      </g>
    </svg>
  );
}

const Bar = ({ x = 0, y, w, h = 6, fill = C.line, r = 3 }) => (
  <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} />
);

function Lms() {
  const courses = [
    ['Data Structures', 0.82, C.blue],
    ['Spring Boot', 0.64, C.cyan],
    ['DBMS', 0.4, C.amber],
  ];
  return (
    <Frame id="lms" title="LMS / DASHBOARD">
      <text fontSize="11" fill={C.text} style={mono}>
        MY COURSES
      </text>
      {courses.map(([name, k, col], i) => (
        <g key={name} transform={`translate(0 ${18 + i * 52})`}>
          <rect width="228" height="42" rx="7" fill="rgba(255,255,255,0.03)" stroke={C.line} />
          <text x="12" y="17" fontSize="9" fill={C.text}>
            {name}
          </text>
          <Bar x={12} y={26} w={150} h={4} />
          <Bar x={12} y={26} w={150 * k} h={4} fill={col} />
          <text x="216" y="30" textAnchor="end" fontSize="9" fill={col} style={mono}>
            {Math.round(k * 100)}%
          </text>
        </g>
      ))}
      <g transform="translate(0 182)">
        <circle cx="30" cy="30" r="24" fill="none" stroke={C.line} strokeWidth="6" />
        <circle
          cx="30"
          cy="30"
          r="24"
          fill="none"
          stroke={C.blue}
          strokeWidth="6"
          strokeDasharray="90 151"
          strokeLinecap="round"
          transform="rotate(-90 30 30)"
        />
        <text x="30" y="34" textAnchor="middle" fontSize="11" fill={C.text} style={mono}>
          3/5
        </text>
        <text x="70" y="22" fontSize="9" fill={C.text}>
          Assessments
        </text>
        <text x="70" y="36" fontSize="8" fill={C.dim} style={mono}>
          ROLE · STUDENT
        </text>
      </g>
    </Frame>
  );
}

function Queue() {
  return (
    <Frame id="queue" glow={C.cyan} title="SMARTQUEUE / LIVE">
      <text fontSize="8" fill={C.dim} style={mono}>
        NOW SERVING
      </text>
      <text y="38" fontSize="34" fill={C.text} style={{ ...mono, letterSpacing: 3 }}>
        A-104
      </text>
      <text x="228" y="12" textAnchor="end" fontSize="8" fill={C.dim} style={mono}>
        EST. WAIT
      </text>
      <text x="228" y="38" textAnchor="end" fontSize="20" fill={C.cyan} style={mono}>
        12m
      </text>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${i * 78} 60)`}>
          <rect
            width="72"
            height="48"
            rx="7"
            fill="rgba(255,255,255,0.03)"
            stroke={i < 2 ? C.cyan : C.line}
            strokeOpacity={i < 2 ? 0.6 : 1}
          />
          <text x="10" y="18" fontSize="7" fill={C.dim} style={mono}>
            COUNTER {i + 1}
          </text>
          <text x="10" y="36" fontSize="11" fill={i < 2 ? C.text : C.dim} style={mono}>
            {i < 2 ? `A-10${2 + i}` : 'CLOSED'}
          </text>
        </g>
      ))}
      {['A-105', 'A-106', 'A-107', 'B-021'].map((t, i) => (
        <g key={t} transform={`translate(0 ${126 + i * 26})`}>
          <line x1="0" y1="20" x2="228" y2="20" stroke={C.line} />
          <text y="12" fontSize="9" fill={C.text} style={mono}>
            {t}
          </text>
          <Bar x={70} y={6} w={90 - i * 14} h={4} fill={C.cyan} />
          <text x="228" y="12" textAnchor="end" fontSize="8" fill={C.dim} style={mono}>
            {12 + i * 4} MIN
          </text>
        </g>
      ))}
    </Frame>
  );
}

function Shop() {
  const items = [
    ['₹1,299', C.blue],
    ['₹849', C.amber],
    ['₹2,199', C.cyan],
    ['₹499', C.green],
  ];
  return (
    <Frame id="shop" glow={C.amber} title="STORE / CATALOGUE">
      <Bar y={0} w={150} h={16} r={8} fill="rgba(255,255,255,0.05)" />
      <text x="10" y="11" fontSize="7" fill={C.dim} style={mono}>
        SEARCH PRODUCTS
      </text>
      <rect x="196" y="0" width="32" height="16" rx="8" fill={C.amber} />
      <text x="212" y="11" textAnchor="middle" fontSize="8" fill="#160a02" style={mono}>
        3
      </text>
      {items.map(([price, col], i) => (
        <g key={price} transform={`translate(${(i % 2) * 118} ${28 + Math.floor(i / 2) * 104})`}>
          <rect width="110" height="96" rx="8" fill="rgba(255,255,255,0.03)" stroke={C.line} />
          <rect x="8" y="8" width="94" height="50" rx="5" fill={col} fillOpacity="0.14" />
          <circle cx="55" cy="33" r="13" fill={col} fillOpacity="0.5" />
          <Bar x={8} y={66} w={60} h={4} />
          <text x="8" y="86" fontSize="9" fill={C.text} style={mono}>
            {price}
          </text>
          <path d="M92 80l4 4 4-4" fill="none" stroke={col} />
        </g>
      ))}
      <rect y="236" width="228" height="22" rx="6" fill={C.amber} />
      <text x="114" y="250" textAnchor="middle" fontSize="8" fill="#160a02" style={mono}>
        CHECKOUT · JWT SECURED
      </text>
    </Frame>
  );
}

function Fitness() {
  const pts = [40, 52, 48, 70, 66, 82, 78, 95, 104, 98, 118, 126];
  const d = pts.map((v, i) => `${i ? 'L' : 'M'}${i * 20.7} ${150 - v}`).join(' ');
  return (
    <Frame id="fitness" glow={C.green} title="FITNESS / PROGRESS">
      <text fontSize="8" fill={C.dim} style={mono}>
        THIS WEEK
      </text>
      <text y="30" fontSize="24" fill={C.text} style={mono}>
        8,240
      </text>
      <text x="96" y="30" fontSize="9" fill={C.dim} style={mono}>
        / 10,000 STEPS
      </text>
      <g transform="translate(0 50)">
        <line
          x1="0"
          y1="30"
          x2="228"
          y2="30"
          stroke={C.green}
          strokeDasharray="3 4"
          strokeOpacity="0.6"
        />
        <text x="228" y="24" textAnchor="end" fontSize="7" fill={C.green} style={mono}>
          GOAL
        </text>
        <path d={`${d} L228 150 L0 150 Z`} fill={C.green} fillOpacity="0.08" />
        <path d={d} fill="none" stroke={C.green} strokeWidth="2" />
        <circle cx={11 * 20.7} cy={150 - 126} r="4" fill={C.green} />
      </g>
      {['RUN', 'LIFT', 'YOGA'].map((t, i) => (
        <g key={t} transform={`translate(${i * 78} 216)`}>
          <rect width="72" height="40" rx="7" fill="rgba(255,255,255,0.03)" stroke={C.line} />
          <text x="10" y="16" fontSize="7" fill={C.dim} style={mono}>
            {t}
          </text>
          <Bar x={10} y={25} w={52} h={4} />
          <Bar x={10} y={25} w={[44, 30, 18][i]} h={4} fill={C.green} />
        </g>
      ))}
    </Frame>
  );
}

function Lab() {
  const layers = [3, 5, 5, 2];
  const nodes = layers.map((n, li) =>
    Array.from({ length: n }, (_, k) => [li * 62 + 10, 60 - (n - 1) * 12 + k * 24]),
  );
  return (
    <Frame id="lab" glow={C.blue} title="LAB / RESNET50 · TESTNG">
      <g>
        {nodes
          .slice(0, -1)
          .map((col, li) =>
            col.flatMap(([x1, y1]) =>
              nodes[li + 1].map(([x2, y2]) => (
                <line
                  key={`${li}-${x1}-${y1}-${y2}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={C.blue}
                  strokeOpacity="0.18"
                />
              )),
            ),
          )}
        {nodes.flat().map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="4.5" fill={C.panel} stroke={C.blue} />
        ))}
        <text x="228" y="56" textAnchor="end" fontSize="8" fill={C.text} style={mono}>
          CAT 0.94
        </text>
        <text x="228" y="70" textAnchor="end" fontSize="8" fill={C.dim} style={mono}>
          DOG 0.05
        </text>
      </g>
      <g transform="translate(0 132)">
        <text fontSize="8" fill={C.dim} style={mono}>
          TEST SUITE
        </text>
        {Array.from({ length: 24 }, (_, i) => (
          <rect
            key={i}
            x={(i % 12) * 19}
            y={10 + Math.floor(i / 12) * 19}
            width="15"
            height="15"
            rx="3"
            fill={C.green}
            fillOpacity={i < 22 ? 0.75 : 0.15}
          />
        ))}
        <text y="68" fontSize="9" fill={C.green} style={mono}>
          22 / 24 PASSED
        </text>
      </g>
      <g transform="translate(0 206)">
        {[30, 46, 24, 52, 38, 44, 20, 34].map((v, i) => (
          <rect
            key={i}
            x={i * 29}
            y={52 - v}
            width="20"
            height={v}
            rx="2"
            fill={i === 3 ? C.amber : C.blue}
            fillOpacity={i === 3 ? 0.9 : 0.45}
          />
        ))}
      </g>
    </Frame>
  );
}

export const screens = { lms: Lms, queue: Queue, shop: Shop, fitness: Fitness, lab: Lab };
