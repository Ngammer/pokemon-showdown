import os
import json
import glob
from collections import defaultdict, Counter

def obtener_archivos_mes(directorio_base, mes, formato):
    """
    Busca recursivamente todos los .json según la estructura de Pokémon Showdown:
    logs/YYYY-MM/formato/YYYY-MM-DD/*.json
    """
    # Ruta relativa construida con los inputs
    ruta_busqueda = os.path.join(directorio_base, mes, formato, "**", "*.json")
    print(f"\nBuscando archivos en: {ruta_busqueda}")
    
    # recursive=True permite buscar dentro de las subcarpetas de cada día (YYYY-MM-DD)
    archivos = glob.glob(ruta_busqueda, recursive=True)
    return archivos

def analizar_logs_showdown(directorio_base, mes, formato):
    archivos_json = obtener_archivos_mes(directorio_base, mes, formato)

    if not archivos_json:
        print(f"❌ No se encontraron archivos .json para el mes '{mes}' y formato '{formato}'.")
        print(f"Verifica que la carpeta exista en: {os.path.join(directorio_base, mes, formato)}")
        return

    print(f"✅ Se encontraron {len(archivos_json)} combates registrados. Procesando datos...\n")

    # Estructuras de datos para almacenar conteos
    total_batallas = 0
    conteo_pokemon = Counter()
    habilidades = defaultdict(Counter)
    objetos = defaultdict(Counter)
    movimientos = defaultdict(Counter)
    teratipos = defaultdict(Counter)
    companeros = defaultdict(Counter)

    for archivo in archivos_json:
        try:
            with open(archivo, "r", encoding="utf-8") as f:
                data = json.load(f)
                total_batallas += 1

                # Extraer equipos de ambos jugadores
                for p in ["p1", "p2"]:
                    team = data.get(f"{p}team", [])
                    equipo_especies = []
                    
                    for mon in team:
                        especie = mon.get("species") or mon.get("name", "Desconocido")
                        equipo_especies.append(especie)
                        conteo_pokemon[especie] += 1

                        # Registrar Habilidad
                        if "ability" in mon and mon["ability"]:
                            habilidades[especie][mon["ability"]] += 1

                        # Registrar Objeto
                        if "item" in mon and mon["item"]:
                            objetos[especie][mon["item"]] += 1

                        # Registrar Teratipo
                        if "teraType" in mon and mon["teraType"]:
                            teratipos[especie][mon["teraType"]] += 1

                        # Registrar Movimientos
                        moves = mon.get("moves", [])
                        for mv in moves:
                            movimientos[especie][mv] += 1

                    # Registrar Compañeros de equipo (Sinergia)
                    for mon1 in equipo_especies:
                        for mon2 in equipo_especies:
                            if mon1 != mon2:
                                companeros[mon1][mon2] += 1

        except Exception as e:
            print(f"⚠️ Error procesando {archivo}: {e}")

    # Calcular porcentajes de uso (2 jugadores por batalla)
    total_apariciones_posibles = total_batallas * 2
    
    resultados = {}
    for poke, count in conteo_pokemon.most_common():
        uso_porcentaje = (count / total_apariciones_posibles) * 100
        
        resultados[poke] = {
            "apariciones_totales": count,
            "porcentaje_uso": round(uso_porcentaje, 2),
            "habilidades": {k: round((v / count) * 100, 2) for k, v in habilidades[poke].most_common(5)},
            "objetos": {k: round((v / count) * 100, 2) for k, v in objetos[poke].most_common(5)},
            "teratipos": {k: round((v / count) * 100, 2) for k, v in teratipos[poke].most_common(5)},
            "movimientos": {k: round((v / count) * 100, 2) for k, v in movimientos[poke].most_common(10)},
            "companeros_frecuentes": {k: round((v / count) * 100, 2) for k, v in companeros[poke].most_common(5)}
        }

    # Nombres de archivos de salida con rutas relativas
    nombre_json = f"estadisticas_{formato}_{mes}.json"
    nombre_txt = f"reporte_{formato}_{mes}.txt"

    # 1. Guardar los datos detallados en JSON
    with open(nombre_json, "w", encoding="utf-8") as f_out:
        json.dump(resultados, f_out, indent=4, ensure_ascii=False)

    # 2. Guardar el reporte en texto plano
    with open(nombre_txt, "w", encoding="utf-8") as f_txt:
        f_txt.write(f"=== ESTADÍSTICAS DE USO: {formato.upper()} ({mes}) ===\n")
        f_txt.write(f"TOTAL DE BATALLAS ANALIZADAS: {total_batallas}\n\n")
        f_txt.write(f"{'Rank':<5} | {'Pokémon':<20} | {'Uso %':<8} | {'Usos Totales'}\n")
        f_txt.write("-" * 55 + "\n")
        
        for rank, (poke, data) in enumerate(resultados.items(), 1):
            f_txt.write(f"{rank:<5} | {poke:<20} | {data['porcentaje_uso']:<8}% | {data['apariciones_totales']}\n")

    print(f"📊 ¡Procesamiento completado con éxito!")
    print(f"- Archivo JSON generado: '{nombre_json}'")
    print(f"- Reporte TXT generado:  '{nombre_txt}'")

if __name__ == "__main__":
    CARPETA_LOGS_BASE = "./logs"

    print("=== PROCESADOR DE LOGS DE PÓKEMON SHOWDOWN ===")
    
    # Pedir datos por consola
    mes_input = input("Ingresa el mes a analizar (ej. 2026-09): ").strip()
    formato_input = input("Ingresa el formato/tier (ej. gen9ou): ").strip().lower()

    if mes_input and formato_input:
        analizar_logs_showdown(CARPETA_LOGS_BASE, mes_input, formato_input)
    else:
        print("❌ Debes ingresar tanto el mes como el formato.")