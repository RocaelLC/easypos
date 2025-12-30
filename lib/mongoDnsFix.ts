import dns from "node:dns";

export function applyMongoDnsFix() {
  // Fuerza resolvers públicos (evita DNS corporativo)
  dns.setServers(["1.1.1.1", "8.8.8.8"]);
  // Fuerza orden IPv4 primero (evita broncas IPv6)
  dns.setDefaultResultOrder("ipv4first");
}
