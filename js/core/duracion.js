/**
 * duracion.js — cuánto tiempo llevamos juntos.
 *
 * Espacio determinista: misma fecha de inicio + mismo instante = mismo resultado.
 * Nada de esto se calcula "a ojo" en la vista.
 *
 * Reglas que respeta:
 *  - "2026-09-18" se interpreta como fecha LOCAL, no UTC (si no, en Argentina
 *    da un día menos).
 *  - El diferencial de calendario usa préstamos (segundos -> minutos -> horas ->
 *    días -> meses -> años), no divisiones aproximadas.
 *  - El total de días se calcula normalizando a medianoche UTC para que el
 *    cambio de horario de verano no sume ni reste un día fantasma.
 */
(function (raiz, fabrica) {
  'use strict';
  var API = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = API;
  else raiz.Amor = Object.assign(raiz.Amor || {}, { duracion: API });
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var MS_POR_DIA = 86400000;

  var MESES_ES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  /** Días que tiene un mes concreto. mes es 0-11 y puede desbordar. */
  function diasDelMes(anio, mes) {
    return new Date(anio, mes + 1, 0).getDate();
  }

  /**
   * Convierte "YYYY-MM-DD" o "YYYY-MM-DDTHH:MM" en un Date LOCAL.
   * Devuelve null si el texto no es una fecha válida.
   */
  function parsearFecha(texto) {
    if (texto instanceof Date) return isNaN(texto.getTime()) ? null : texto;
    if (typeof texto !== 'string') return null;

    var m = texto.trim().match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/
    );
    if (!m) return null;

    var anio = Number(m[1]);
    var mes = Number(m[2]) - 1;
    var dia = Number(m[3]);
    var hora = Number(m[4] || 0);
    var min = Number(m[5] || 0);
    var seg = Number(m[6] || 0);

    if (mes < 0 || mes > 11) return null;
    if (dia < 1 || dia > diasDelMes(anio, mes)) return null;
    if (hora > 23 || min > 59 || seg > 59) return null;

    return new Date(anio, mes, dia, hora, min, seg, 0);
  }

  /** Días enteros de calendario entre dos fechas, inmune al horario de verano. */
  function diasEntre(inicio, fin) {
    var a = Date.UTC(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
    var b = Date.UTC(fin.getFullYear(), fin.getMonth(), fin.getDate());
    return Math.round((b - a) / MS_POR_DIA);
  }

  /**
   * Diferencia de calendario con préstamos.
   * @returns {{anios,meses,dias,horas,minutos,segundos,diasTotales,futuro:boolean}}
   */
  function calcular(inicioTexto, ahora) {
    var inicio = parsearFecha(inicioTexto);
    if (!inicio) return null;
    var fin = ahora ? (parsearFecha(ahora) || new Date(ahora)) : new Date();
    if (isNaN(fin.getTime())) return null;

    var futuro = fin.getTime() < inicio.getTime();
    if (futuro) { var tmp = inicio; inicio = fin; fin = tmp; }

    var segundos = fin.getSeconds() - inicio.getSeconds();
    var minutos = fin.getMinutes() - inicio.getMinutes();
    var horas = fin.getHours() - inicio.getHours();
    var dias = fin.getDate() - inicio.getDate();
    var meses = fin.getMonth() - inicio.getMonth();
    var anios = fin.getFullYear() - inicio.getFullYear();

    if (segundos < 0) { segundos += 60; minutos -= 1; }
    if (minutos < 0) { minutos += 60; horas -= 1; }
    if (horas < 0) { horas += 24; dias -= 1; }
    if (dias < 0) { meses -= 1; dias += diasDelMes(fin.getFullYear(), fin.getMonth() - 1); }
    if (meses < 0) { meses += 12; anios -= 1; }

    return {
      anios: anios,
      meses: meses,
      dias: dias,
      horas: horas,
      minutos: minutos,
      segundos: segundos,
      diasTotales: diasEntre(inicio, fin),
      futuro: futuro
    };
  }

  /** "18 de septiembre de 2024" */
  function fechaLarga(inicioTexto) {
    var d = parsearFecha(inicioTexto);
    if (!d) return '';
    return d.getDate() + ' de ' + MESES_ES[d.getMonth()] + ' de ' + d.getFullYear();
  }

  function plural(n, singular, plural_) {
    return n + ' ' + (n === 1 ? singular : plural_);
  }

  /** "2 años, 1 mes y 3 días" — se saltea las unidades en cero. */
  function enPalabras(d) {
    if (!d) return '';
    var partes = [];
    if (d.anios) partes.push(plural(d.anios, 'año', 'años'));
    if (d.meses) partes.push(plural(d.meses, 'mes', 'meses'));
    if (d.dias) partes.push(plural(d.dias, 'día', 'días'));
    if (!partes.length) return 'hoy mismo';
    if (partes.length === 1) return partes[0];
    return partes.slice(0, -1).join(', ') + ' y ' + partes[partes.length - 1];
  }

  /** "07:04:59" */
  function reloj(d) {
    if (!d) return '00:00:00';
    var dd = function (n) { return String(n).padStart(2, '0'); };
    return dd(d.horas) + ':' + dd(d.minutos) + ':' + dd(d.segundos);
  }

  /** Separador de miles con punto, como se escribe en Argentina. */
  function miles(n) {
    return String(Math.abs(Math.trunc(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  return {
    parsearFecha: parsearFecha,
    diasEntre: diasEntre,
    diasDelMes: diasDelMes,
    calcular: calcular,
    fechaLarga: fechaLarga,
    enPalabras: enPalabras,
    reloj: reloj,
    miles: miles,
    MESES_ES: MESES_ES
  };
});
