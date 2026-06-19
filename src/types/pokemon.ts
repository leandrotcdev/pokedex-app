export interface Stats {
  hp: number;
  ataque: number;
  defesa: number;
  velocidade: number;
  "special-attack"?: number;
  "special-defense"?: number;
}

export interface Pokemon {
  id: number;
  nome: string;
  tipo: string[];
  descricao: string;
  peso: string; // Ex: "6.0 kg"
  altura: string; // Ex: "0.4 m"
  habilidades: Stats;
  imagemDestaque: string;
  gifInterativo?: string;
}