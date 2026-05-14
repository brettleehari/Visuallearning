import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text, Line } from '@react-three/drei'
import { useAppStore } from '../store/useAppStore'
import { getDocColor, QUERY_COLOR, similarityToColor } from '../lib/colors'
import { useState } from 'react'
import * as THREE from 'three'

function Axes() {
  const variance = useAppStore(s => s.pcaVariance)
  const len = 2
  return (
    <group>
      {/* X axis - PC1 */}
      <Line points={[[-len, 0, 0], [len, 0, 0]]} color="#4da6e855" lineWidth={1} />
      <Text position={[len + 0.3, 0, 0]} fontSize={0.12} color="#4da6e8" anchorX="left">
        PC1 ({(variance[0] * 100).toFixed(0)}%)
      </Text>
      {/* Y axis - PC2 */}
      <Line points={[[0, -len, 0], [0, len, 0]]} color="#4dd88a55" lineWidth={1} />
      <Text position={[0, len + 0.2, 0]} fontSize={0.12} color="#4dd88a" anchorX="center">
        PC2 ({(variance[1] * 100).toFixed(0)}%)
      </Text>
      {/* Z axis - PC3 */}
      <Line points={[[0, 0, -len], [0, 0, len]]} color="#a87ce855" lineWidth={1} />
      <Text position={[0, 0, len + 0.3]} fontSize={0.12} color="#a87ce8" anchorX="center">
        PC3 ({(variance[2] * 100).toFixed(0)}%)
      </Text>
    </group>
  )
}

function DocumentSphere({ index }: { index: number }) {
  const doc = useAppStore(s => s.documents[index])
  const [hovered, setHovered] = useState(false)
  if (!doc?.vector3d) return null
  const color = getDocColor(index)
  const label = doc.text.length > 30 ? doc.text.slice(0, 30) + '...' : doc.text

  return (
    <group position={doc.vector3d}>
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[hovered ? 0.07 : 0.05, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? 0.5 : 0.2} />
      </mesh>
      <Text
        position={[0, 0.12, 0]}
        fontSize={0.07}
        color={color}
        anchorX="center"
        anchorY="bottom"
        maxWidth={2}
      >
        {label}
      </Text>
      {hovered && doc.vectorFull && (
        <Text
          position={[0, -0.12, 0]}
          fontSize={0.05}
          color="#706e64"
          anchorX="center"
          anchorY="top"
          maxWidth={3}
        >
          [{doc.vectorFull.slice(0, 6).map(v => v.toFixed(3)).join(', ')}, ... +{(useAppStore.getState().dim - 6)} more]
        </Text>
      )}
    </group>
  )
}

function QuerySphere() {
  const query = useAppStore(s => s.query)
  const [hovered, setHovered] = useState(false)
  if (!query?.vector3d) return null

  return (
    <group position={query.vector3d}>
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[hovered ? 0.1 : 0.08, 16, 16]} />
        <meshStandardMaterial color={QUERY_COLOR} emissive={QUERY_COLOR} emissiveIntensity={hovered ? 0.6 : 0.3} />
      </mesh>
      <Text
        position={[0, 0.15, 0]}
        fontSize={0.08}
        color={QUERY_COLOR}
        anchorX="center"
        anchorY="bottom"
        fontWeight="bold"
      >
        QUERY
      </Text>
      {hovered && (
        <Text
          position={[0, -0.14, 0]}
          fontSize={0.05}
          color="#706e64"
          anchorX="center"
          anchorY="top"
          maxWidth={3}
        >
          {query.text}
        </Text>
      )}
    </group>
  )
}

function DistanceRays() {
  const query = useAppStore(s => s.query)
  const documents = useAppStore(s => s.documents)
  const metric = useAppStore(s => s.metric)

  if (!query?.vector3d) return null

  return (
    <group>
      {documents.map((doc, i) => {
        if (!doc.vector3d || doc.cosineSimilarity === undefined) return null
        const similarity = metric === 'cosine' ? doc.cosineSimilarity : Math.max(0, 1 - doc.euclideanDistance! / 2)
        const color = new THREE.Color(similarityToColor(similarity))
        return (
          <Line
            key={i}
            points={[query.vector3d!, doc.vector3d]}
            color={color}
            lineWidth={Math.max(1, similarity * 4)}
            opacity={0.6}
            transparent
          />
        )
      })}
    </group>
  )
}

function EmptyState() {
  const docs = useAppStore(s => s.documents)
  if (docs.length > 0) return null
  return (
    <Text position={[0, 0, 0]} fontSize={0.15} color="#706e64" anchorX="center" anchorY="middle" maxWidth={4}>
      Paste text on the left and click Embed
    </Text>
  )
}

export function Scene3D() {
  const documents = useAppStore(s => s.documents)
  const dim = useAppStore(s => s.dim)

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      {/* PCA disclaimer */}
      {documents.length > 0 && (
        <div
          className="absolute top-2 left-2 z-10 text-xs font-mono px-2 py-1 rounded"
          style={{ background: 'rgba(10,11,15,0.85)', color: 'var(--muted)', fontSize: '0.55rem' }}
        >
          3D = PCA projection of {dim}D vectors. Similarity computed in original space.
        </div>
      )}
      <Canvas camera={{ position: [3, 2, 3], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <Axes />
        <EmptyState />
        {documents.map((_, i) => (
          <DocumentSphere key={i} index={i} />
        ))}
        <QuerySphere />
        <DistanceRays />
        <OrbitControls makeDefault enableDamping dampingFactor={0.1} />
      </Canvas>
    </div>
  )
}
