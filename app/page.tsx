import { Candidatos } from '@/components/candidatos/Candidatos'
import { Fechamento } from '@/components/fechamento/Fechamento'
import { ForcaAbrasel } from '@/components/forca/ForcaAbrasel'
import { Hero } from '@/components/hero/Hero'
import { Mural } from '@/components/mural/Mural'
import { Pautas } from '@/components/pautas/Pautas'
import { Rodape } from '@/components/fechamento/Rodape'
import { Sobre } from '@/components/sobre/Sobre'
import { lerCandidatos, lerConfig, lerMural, lerPautas } from '@/lib/conteudo'
import { montarTexto } from '@/lib/compartilhar'

/**
 * Página única, seis blocos, navegação por âncora.
 *
 * Tudo é lido dos arquivos JSON em build time. Não há chamada de rede em
 * runtime, nem no servidor nem no cliente: o visitante recebe HTML e imagens
 * servidos pelo CDN. Isso elimina latência, estado de carregamento e qualquer
 * cenário em que o site fique no ar mostrando conteúdo vazio.
 */
export default function Pagina() {
  const config = lerConfig()
  const pautas = lerPautas()
  const candidatos = lerCandidatos()
  const mural = lerMural()

  const textoCompartilhamento = montarTexto(config.textoCompartilhamento, config.urlSite)

  return (
    <>
      <main>
        <Hero
          frase={config.fraseHero}
          linhaApoio={config.linhaApoio}
          textoCompartilhamento={textoCompartilhamento}
          url={config.urlSite}
        />

        <Sobre paragrafos={config.sobre} urlVideo={config.urlVideo} />

        <ForcaAbrasel dados={config.forcaAbrasel} />

        <Pautas pautas={pautas} />

        <Candidatos candidatos={candidatos} url={config.urlSite} />

        <Mural fotos={mural} abertura={config.aberturaMural} />

        <Fechamento
          textoCompartilhamento={textoCompartilhamento}
          url={config.urlSite}
          dataPleito={config.dataPleito}
        />
      </main>

      <Rodape aviso={config.avisoRodape} />
    </>
  )
}
