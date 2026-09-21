/**
 * O número de urna.
 *
 * É o dado que o eleitor precisa levar na cabeça, então tem o maior destaque
 * tipográfico do card — maior que o próprio nome. Laranja da marca sobre fundo
 * claro (nunca texto branco sobre pastilha laranja, que dá 2.59:1 e reprova).
 *
 * `tabular-nums` mantém todos os dígitos com a mesma largura: uma coluna de
 * cards com números de 2 e de 5 dígitos fica alinhada.
 */

type Props = {
  numero: string
  className?: string
}

export function NumeroUrna({ numero, className = '' }: Props) {
  return (
    <p
      className={`font-sans text-[2.75rem] font-bold leading-none tracking-tight tabular-nums text-ma-orange ${className}`.trim()}
    >
      <span className="sr-only">Número de urna: </span>
      {numero}
    </p>
  )
}
