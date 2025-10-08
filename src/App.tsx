import { useEffect, useRef } from "react";
import "./App.css";

interface Vector2D {
  x: number;
  y: number;
}

interface Ship {
  pos: Vector2D;
  vel: Vector2D;
  angle: number;
  thrust: boolean;
}

interface Asteroid {
  pos: Vector2D;
  vel: Vector2D;
  size: number;
  points: Vector2D[];
}

interface Bullet {
  pos: Vector2D;
  vel: Vector2D;
  life: number;
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 400;

    // Game state
    const keys: { [key: string]: boolean } = {};
    let score = 0;
    let gameOver = false;

    const ship: Ship = {
      pos: { x: canvas.width / 2, y: canvas.height / 2 },
      vel: { x: 0, y: 0 },
      angle: -Math.PI / 2,
      thrust: false,
    };

    const asteroids: Asteroid[] = [];
    const bullets: Bullet[] = [];

    // Create random asteroid
    const createAsteroid = (x?: number, y?: number, size: number = 3) => {
      const pos =
        x !== undefined && y !== undefined
          ? { x, y }
          : {
              x: Math.random() < 0.5 ? 0 : canvas.width,
              y: Math.random() * canvas.height,
            };

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1;

      // Generate random asteroid shape
      const points: Vector2D[] = [];
      const vertices = 8 + Math.floor(Math.random() * 4);
      const radius = size * 15;
      for (let i = 0; i < vertices; i++) {
        const angle = (i / vertices) * Math.PI * 2;
        const r = radius * (0.7 + Math.random() * 0.6);
        points.push({
          x: Math.cos(angle) * r,
          y: Math.sin(angle) * r,
        });
      }

      asteroids.push({
        pos,
        vel: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        size,
        points,
      });
    };

    // Initialize asteroids
    for (let i = 0; i < 5; i++) {
      createAsteroid();
    }

    // Input handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
      if (e.key === " ") {
        e.preventDefault();
        // Fire bullet
        bullets.push({
          pos: { ...ship.pos },
          vel: {
            x: Math.cos(ship.angle) * 10,
            y: Math.sin(ship.angle) * 10,
          },
          life: 60,
        });
      }
      if (gameOver && e.key === "Enter") {
        location.reload();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Game loop
    const gameLoop = () => {
      if (!ctx || !canvas) return;

      // Clear canvas
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (gameOver) {
        ctx.fillStyle = "#fff";
        ctx.font = "48px monospace";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
        ctx.font = "24px monospace";
        ctx.fillText(
          `Score: ${score}`,
          canvas.width / 2,
          canvas.height / 2 + 40
        );
        ctx.fillText(
          "Press ENTER to restart",
          canvas.width / 2,
          canvas.height / 2 + 80
        );
        return;
      }

      // Update ship
      if (keys["ArrowLeft"]) ship.angle -= 0.1;
      if (keys["ArrowRight"]) ship.angle += 0.1;

      ship.thrust = keys["ArrowUp"] || false;

      if (ship.thrust) {
        ship.vel.x += Math.cos(ship.angle) * 0.15;
        ship.vel.y += Math.sin(ship.angle) * 0.15;
      }

      // Apply friction
      ship.vel.x *= 0.99;
      ship.vel.y *= 0.99;

      // Update position
      ship.pos.x += ship.vel.x;
      ship.pos.y += ship.vel.y;

      // Wrap around screen
      if (ship.pos.x < 0) ship.pos.x = canvas.width;
      if (ship.pos.x > canvas.width) ship.pos.x = 0;
      if (ship.pos.y < 0) ship.pos.y = canvas.height;
      if (ship.pos.y > canvas.height) ship.pos.y = 0;

      // Draw ship
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(
        ship.pos.x + Math.cos(ship.angle) * 15,
        ship.pos.y + Math.sin(ship.angle) * 15
      );
      ctx.lineTo(
        ship.pos.x + Math.cos(ship.angle + 2.5) * 10,
        ship.pos.y + Math.sin(ship.angle + 2.5) * 10
      );
      ctx.lineTo(
        ship.pos.x + Math.cos(ship.angle + Math.PI) * 8,
        ship.pos.y + Math.sin(ship.angle + Math.PI) * 8
      );
      ctx.lineTo(
        ship.pos.x + Math.cos(ship.angle - 2.5) * 10,
        ship.pos.y + Math.sin(ship.angle - 2.5) * 10
      );
      ctx.closePath();
      ctx.stroke();

      // Draw thrust
      if (ship.thrust) {
        ctx.beginPath();
        ctx.moveTo(
          ship.pos.x + Math.cos(ship.angle + Math.PI) * 8,
          ship.pos.y + Math.sin(ship.angle + Math.PI) * 8
        );
        ctx.lineTo(
          ship.pos.x + Math.cos(ship.angle + Math.PI) * 15,
          ship.pos.y + Math.sin(ship.angle + Math.PI) * 15
        );
        ctx.stroke();
      }

      // Update and draw asteroids
      for (let i = asteroids.length - 1; i >= 0; i--) {
        const ast = asteroids[i];
        ast.pos.x += ast.vel.x;
        ast.pos.y += ast.vel.y;

        // Wrap around
        if (ast.pos.x < -50) ast.pos.x = canvas.width + 50;
        if (ast.pos.x > canvas.width + 50) ast.pos.x = -50;
        if (ast.pos.y < -50) ast.pos.y = canvas.height + 50;
        if (ast.pos.y > canvas.height + 50) ast.pos.y = -50;

        // Draw asteroid
        ctx.strokeStyle = "#fff";
        ctx.beginPath();
        ctx.moveTo(ast.pos.x + ast.points[0].x, ast.pos.y + ast.points[0].y);
        for (let j = 1; j < ast.points.length; j++) {
          ctx.lineTo(ast.pos.x + ast.points[j].x, ast.pos.y + ast.points[j].y);
        }
        ctx.closePath();
        ctx.stroke();

        // Check collision with ship
        const dx = ship.pos.x - ast.pos.x;
        const dy = ship.pos.y - ast.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < ast.size * 15) {
          gameOver = true;
        }
      }

      // Update and draw bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.pos.x += bullet.vel.x;
        bullet.pos.y += bullet.vel.y;
        bullet.life--;

        // Wrap around
        if (bullet.pos.x < 0) bullet.pos.x = canvas.width;
        if (bullet.pos.x > canvas.width) bullet.pos.x = 0;
        if (bullet.pos.y < 0) bullet.pos.y = canvas.height;
        if (bullet.pos.y > canvas.height) bullet.pos.y = 0;

        if (bullet.life <= 0) {
          bullets.splice(i, 1);
          continue;
        }

        // Check collision with asteroids
        for (let j = asteroids.length - 1; j >= 0; j--) {
          const ast = asteroids[j];
          const dx = bullet.pos.x - ast.pos.x;
          const dy = bullet.pos.y - ast.pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < ast.size * 15) {
            // Hit!
            score += ast.size * 10;
            bullets.splice(i, 1);

            // Split asteroid
            if (ast.size > 1) {
              for (let k = 0; k < 2; k++) {
                createAsteroid(ast.pos.x, ast.pos.y, ast.size - 1);
              }
            }

            asteroids.splice(j, 1);

            // Spawn new asteroid if all destroyed
            if (asteroids.length === 0) {
              for (let k = 0; k < 5; k++) {
                createAsteroid();
              }
            }
            break;
          }
        }

        // Draw bullet
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(bullet.pos.x, bullet.pos.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw score
      ctx.fillStyle = "#fff";
      ctx.font = "24px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${score}`, 20, 40);

      requestAnimationFrame(gameLoop);
    };

    gameLoop();

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
        height: "100dvh",
        overflow: "hidden",
      }}
    >
      <canvas ref={canvasRef} style={{ border: "1px solid #333" }} />
    </div>
  );
}

export default App;
