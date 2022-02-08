<?php

class SvgEditor {

	public static function onBeforePageDisplay( $out ) {

		$out->addModules( 'ext.SvgEditor' );

		return true;

	}

}
