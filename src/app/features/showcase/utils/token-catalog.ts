/** Un token de diseño, tal como el documento lo declara en realidad. */
export interface TokenEntry {
  /** La propiedad personalizada, incluyendo el `--` inicial. */
  readonly name: string;

  /** Su valor resuelto en el elemento raíz, en el tema activo. */
  readonly value: string;
}

/**
 * Toda propiedad personalizada que aplica a la raíz, bajo un prefijo,
 * resuelta contra el tema activo.
 *
 * La página de Fundamentos se genera a partir de esto en vez de una lista
 * escrita a mano. Un catálogo que repite sus propios tokens es una segunda
 * copia que se desalinea: el día que alguien agregue `--color-primary-350`,
 * una lista se quedaría callada y esto lo muestra. Es el mismo razonamiento
 * detrás de `ICON_NAMES`.
 *
 * Dos fuentes, en orden:
 *
 * 1. **El estilo computado del elemento raíz.** Los motores modernos
 *    enumeran ahí las propiedades personalizadas, que es a la vez la
 *    respuesta más simple y la más veraz — es lo que realmente aplica, sea
 *    lo que sea lo que lo haya producido.
 * 2. **Recorrer `document.styleSheets`**, para motores que no enumeran
 *    nada. Este era el enfoque original y tiene un modo de fallo que el
 *    primero no tiene: leer `cssRules` lanza una excepción sobre una hoja
 *    que la página no tiene permiso de inspeccionar, y basta con que una
 *    extensión del navegador inyecte una. Cuando eso pasaba, las rampas
 *    volvían vacías y la página se veía rota — en un navegador y no en
 *    otro, que es el peor tipo de bug para perseguir.
 *
 * Devuelve una lista vacía solo cuando ninguna de las dos encuentra nada,
 * para que quien llama lo pueda decir en vez de renderizar un hueco
 * silencioso.
 */
export function collectTokens(document: Document, prefix: string): readonly TokenEntry[] {
  const view = document.defaultView;
  if (!view) {
    return [];
  }
  const styles = view.getComputedStyle(document.documentElement);

  const names = new Set(Array.from(styles).filter((property) => property.startsWith(prefix)));
  if (names.size === 0) {
    collectFromSheets(document, prefix, names);
  }

  return [...names]
    .sort(byNumericSuffix)
    .map((name) => ({ name, value: styles.getPropertyValue(name).trim() }))
    .filter((entry) => entry.value !== '');
}

function collectFromSheets(document: Document, prefix: string, names: Set<string>): void {
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    collectFromRules(rules, prefix, names);
  }
}

/**
 * Recorre una lista de reglas, incluyendo dentro de media queries y capas.
 *
 * Solo se consideran las reglas que apuntan a la raíz: un token declarado
 * en un componente no es parte del vocabulario que el sistema entrega.
 */
function collectFromRules(rules: CSSRuleList, prefix: string, names: Set<string>): void {
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSGroupingRule) {
      collectFromRules(rule.cssRules, prefix, names);
      continue;
    }
    if (!(rule instanceof CSSStyleRule) || !targetsRoot(rule.selectorText)) {
      continue;
    }
    for (const property of Array.from(rule.style)) {
      if (property.startsWith(prefix)) {
        names.add(property);
      }
    }
  }
}

function targetsRoot(selector: string): boolean {
  return selector.includes(':root') || selector === 'html.dark';
}

/**
 * Ordena `--color-primary-50` antes que `--color-primary-100`.
 *
 * Un ordenamiento de strings simple pone el 100 antes que el 50 y convierte
 * una rampa en un sinsentido, que es exactamente el tipo de detalle que una
 * lista escrita a mano acierta por accidente y a una generada hay que
 * decírselo.
 */
function byNumericSuffix(a: string, b: string): number {
  const [aBase, aStep] = split(a);
  const [bBase, bStep] = split(b);
  if (aBase !== bBase) {
    return aBase.localeCompare(bBase);
  }
  return aStep - bStep;
}

function split(name: string): [string, number] {
  const match = /^(.*?)-(\d+)$/.exec(name);
  return match ? [match[1], Number(match[2])] : [name, -1];
}
