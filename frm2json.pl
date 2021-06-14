#!/usr/bin/perl

use strict;
use warnings;

#

use File::Find;
use File::Spec;
use JSON;

#

my( %json, @frm );

#

sub findFrm
{
    my $file = $File::Find::name;
    my $extension = lc(substr($file, -4));

    push( @frm, $file ) if( $extension eq '.frm' );
    push( @frm, $file ) if( $extension =~ /\.fr[0-5]/ )
}

#

sub json_frm
{
    my %root;

    foreach my $frm ( sort {$a cmp $b} @frm )
    {
        $frm =~ s!^\./!!;

        my( undef, $dir, $file ) = File::Spec->splitpath( $frm );

        $dir =~ s![/]+$!!;

        my $set  = substr( $file, 0, 6 );
        my $anim = uc(substr( $file, 6, 2 ));

        next if( $anim eq 'NA' );

        # it's easier to store entries initially as arrays...

        push( @{ $root{"$dir"}{"$anim"} }, $file );
    }

    # ...and change them to string if they contain only one element

    foreach my $dir ( keys( %root ))
    {
        foreach my $anim ( keys( %{ $root{$dir} }))
        {
            if(scalar(@{ $root{$dir}{$anim} }) == 1)
            {
                my $value = $root{$dir}{$anim}[0];
                $root{$dir}{$anim} = $value;
            }
        }
    }

    $json{'fallout-animations'} = \%root;
}

#

find({ wanted => \&findFrm, no_chdir => 1 }, '.');

json_frm();

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
