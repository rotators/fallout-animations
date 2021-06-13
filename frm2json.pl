#!/usr/bin/perl

use strict;
use warnings;

use File::Find;
use File::Spec;
use JSON;

use Data::Dumper;

$Data::Dumper::Sortkeys = 1;

my %json;

my( @frm, @frX );
sub FindFiles
{
    my $file = $File::Find::name;
    my $extension = lc(substr($file, -4));

    push( @frm, $file ) if( $extension eq '.frm' );
    push( @frm, $file ) if( $extension =~ /\.fr[0-5]/ )
}

find({ wanted => \&FindFiles, no_chdir => 1 }, '.');

foreach my $frm ( sort {$a cmp $b} @frm )
{
    $frm =~ s!^\./!!;

    my( undef, $dir, $file ) = File::Spec->splitpath( $frm );

    $dir =~ s![/]+$!!;

    my $set  = substr( $file, 0, 6 );
    my $anim = substr( $file, 6, 2 );

    push( @{ $json{'fallout-animations'}{"$dir"}{uc("$anim")} }, $file );
}

#print( Dumper( %json ));

foreach my $dir ( keys( %{ $json{'fallout-animations'} }))
{
    foreach my $anim ( keys( %{ $json{'fallout-animations'}{$dir} }))
    {
        if(scalar(@{ $json{'fallout-animations'}{$dir}{$anim} }) == 1)
        {
            my $value = $json{'fallout-animations'}{$dir}{$anim}[0];
            $json{'fallout-animations'}{$dir}{$anim} = $value;
        }
    }
}

if( open( my $file, ">", "docs/fallout-animations.json" ))
{
    print( $file JSON->new->pretty->canonical->encode(\%json));
    close( $file );
}
else
{
    print( "Cannot write: docs/fallout-animations.json\n\n" );
    exit 1;
}
